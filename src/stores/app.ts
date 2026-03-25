import { defineStore } from 'pinia'
import type { AppData, Classroom, GrowthConfig, PetId, ScoreCategory, ScoreRule, ShopItem, ShopItemCategory, Student } from '@/lib/models'
import { expToNext, newId } from '@/lib/models'
import { loadJson, saveJson } from '@/lib/storage'
import { clearSavedHandle, getSupport, getSavedHandle, pickTargetFile, writeBackupJson } from '@/lib/autoBackup'
import { firstPet } from '@/lib/pets'
import { dataApi } from '@/lib/api'
import { useAuthStore } from './auth'

const LS_KEY = 'class-pet-home:data'
const LS_VERSION_KEY = 'class-pet-home:dataVersion'
const LS_PREF_AUTO_BACKUP = 'class-pet-home:autoBackupEnabled'
const LS_PREF_AUTO_BACKUP_INTERVAL = 'class-pet-home:autoBackupIntervalSec'

let autoBackupTimer: number | null = null
let autoBackupRunning = false

// 云端同步配置
let syncTimer: number | null = null
let isSyncing = false
const SYNC_INTERVAL = 5000 // 5 秒同步一次

const defaultRules: ScoreRule[] = [
  { id: 'r1', title: '作业完成优秀', delta: 1, category: '学习', enabled: true, icon: '📗', scope: 'all' },
  { id: 'r2', title: '平时测验满分', delta: 3, category: '学习', enabled: true, icon: '🧮', scope: 'all' },
  { id: 'r3', title: '默写全对', delta: 1, category: '学习', enabled: true, icon: '✍️', scope: 'all' },
  { id: 'r4', title: '主动帮助同学', delta: 2, category: '行为', enabled: true, icon: '👍', scope: 'all' },
  { id: 'r5', title: '课前准备充分', delta: 1, category: '行为', enabled: true, icon: '⭐', scope: 'all' },
  { id: 'r6', title: '忘带学习用品', delta: -1, category: '行为', enabled: true, icon: '⚠️', scope: 'all' },
]

function seedClassroom(): Classroom {
  const p = firstPet()
  const students: Student[] = [
    { id: 's1', name: '阿彬', number: '0001', points: 0, badges: 0 },
  ]
  return { id: 'c1', name: '南光一班', students }
}

function seedShopItems(): ShopItem[] {
  const mk = (p: {
    title: string
    description: string
    priceBadges: number
    stock: number
    category: ShopItemCategory
    icon: string
  }): ShopItem => ({
    id: newId('item'),
    title: p.title,
    description: p.description,
    priceBadges: p.priceBadges,
    stock: p.stock,
    category: p.category,
    icon: p.icon,
    enabled: true,
  })

  return [
    mk({ title: '小零食券', description: '兑换一份小零食', priceBadges: 1, stock: 20, category: '美食', icon: '🍪' }),
    mk({ title: '免作业卡', description: '一次作业免写（老师确认）', priceBadges: 10, stock: 10, category: '特权', icon: '🪪' }),
  ]
}

function defaultGrowth(): GrowthConfig {
  const maxLevel = 10
  const thresholds = Array.from({ length: maxLevel - 1 }, (_, i) => 40 + i * 20)
  return { thresholds, maxLevel, badgeEveryExp: 200 }
}

function initialData(): AppData {
  const data: AppData = {
    version: 1,
    activeClassroomId: 'c1',
    classrooms: [seedClassroom()],
    rules: defaultRules,
    records: [],
    shopItems: seedShopItems(),
    shopRecords: [],
    growth: defaultGrowth(),
  }
  return normalizeData(data)
}

export type SortMode = 'name' | 'number' | 'badges' | 'growth'

function normalizeData(data: AppData): AppData {
  // 确保基础数组属性存在
  if (!Array.isArray((data as any).records)) (data as any).records = []
  if (!Array.isArray((data as any).classrooms) || (data as any).classrooms.length === 0) {
    (data as any).classrooms = [seedClassroom()]
    ;(data as any).activeClassroomId = 'c1'
  }

  for (const c of data.classrooms ?? []) {
    for (const s of c.students ?? []) {
      if (typeof (s as any).badges !== 'number') (s as any).badges = 0
      if (typeof (s as any).points !== 'number') {
        const n = Number((s as any).points)
        ;(s as any).points = Number.isFinite(n) ? n : 0
      }
    }
  }
  if (!(data as any).shopItems) (data as any).shopItems = seedShopItems()
  if (!(data as any).shopRecords) (data as any).shopRecords = []
  if (!(data as any).growth) (data as any).growth = defaultGrowth()
  if (!Array.isArray((data as any).rules)) (data as any).rules = defaultRules
  for (const r of (data as any).rules as ScoreRule[]) {
    if (typeof (r as any).enabled !== 'boolean') (r as any).enabled = true
    if (typeof (r as any).icon !== 'string' || !(r as any).icon) (r as any).icon = '⭐'
    const scope = (r as any).scope
    if (scope !== 'all' && scope !== 'class') (r as any).scope = 'all'
  }
  const g = (data as any).growth as GrowthConfig
  if (!Array.isArray(g.thresholds) || typeof g.maxLevel !== 'number') (data as any).growth = defaultGrowth()
  return data
}

export const useAppStore = defineStore('app', {
  state: () => {
    const loadedData = loadJson<AppData>(LS_KEY)
    const initial = initialData()
    const mergedData = loadedData ? normalizeData({ ...initial, ...loadedData }) : initial

    return {
      data: mergedData,
      dataVersion: (parseInt(localStorage.getItem(LS_VERSION_KEY) || '0', 10) || 0) as number,
      cloudSyncEnabled: false as boolean,
      cloudSyncError: null as string | null,
      ui: {
        query: '',
        sortMode: 'name' as SortMode,
        modal: null as null | 'adopt' | 'score' | 'settings' | 'leaderboard' | 'records' | 'classManager' | 'shop',
        modalStudentId: null as null | string,
        modalStudentIds: [] as string[],
        modalCategory: '学习' as ScoreCategory,
        batchMode: false,
        batchAction: 'score' as 'score' | 'adopt',
        selectedStudentIds: [] as string[],
        scoreFx: null as null | { studentId: string; kind: 'plus' | 'minus'; ts: number },
        levelUp: null as null | { studentId: string; studentName: string; petId: string; level: number; ts: number },
        autoBackupEnabled: (loadJson<boolean>(LS_PREF_AUTO_BACKUP) ?? false) as boolean,
        autoBackupHasTarget: false,
        autoBackupTargetName: '' as string,
        autoBackupIntervalSec: (loadJson<number>(LS_PREF_AUTO_BACKUP_INTERVAL) ?? 60) as number,
        autoBackupLastOkAt: null as null | number,
        autoBackupLastError: null as null | string,
        cardViewMode: 'large' as 'large' | 'mini',
      },
      activeView: 'classroom' as 'classroom' | 'leaderboard' | 'shop' | 'records' | 'settings' | 'classManager',
      isMobileView: false as boolean,
    }
  },
  getters: {
    activeClassroom(state): Classroom | undefined {
      const classrooms = state.data?.classrooms ?? []
      if (classrooms.length === 0) return undefined
      const found = classrooms.find((c) => c.id === state.data.activeClassroomId)
      return found ?? classrooms[0]
    },
    filteredStudents(): Student[] {
      const c = this.activeClassroom
      if (!c) return []
      const students = c.students ?? []
      const q = this.ui.query.trim()
      let list = students
      if (q) list = list.filter((s) => s.name.includes(q) || (s.number ?? '').includes(q))
      const getNumber = (s: Student) => {
        const n = Number.parseInt(s.number ?? '', 10)
        return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
      }
      const getBadges = (s: Student) => {
        return s.points
      }
      const getGrowth = (s: Student) => {
        if (!s.pet) return -1
        const need = expToNext(s.pet.level)
        const ratio = need > 0 ? s.pet.exp / need : 0
        return s.pet.level + ratio
      }

      list = [...list].sort((a, b) => {
        switch (this.ui.sortMode) {
          case 'name':
            return a.name.localeCompare(b.name, 'zh-CN')
          case 'number':
            return getNumber(a) - getNumber(b)
          case 'badges':
            return getBadges(b) - getBadges(a)
          case 'growth':
            return getGrowth(b) - getGrowth(a)
          default:
            return 0
        }
      })
      return list
    },
  },
  actions: {
    initMobileView() {
      this.isMobileView = window.innerWidth <= 640
      window.addEventListener('resize', () => {
        this.isMobileView = window.innerWidth <= 640
      })
    },
    // 计算升级到下一级所需的经验
    expNeed(level: number): number {
      const thresholds = this.data.growth.thresholds
      if (level >= 1 && level <= thresholds.length) {
        return thresholds[level - 1]
      }
      // 满级后每级固定需要 200 经验
      return this.data.growth.badgeEveryExp
    },

    persist(skipCloud?: boolean) {
      saveJson(LS_KEY, this.data)
      if (!skipCloud && this.cloudSyncEnabled) {
        this.debouncedSync()
      }
    },

    // 云端同步相关
    async enableCloudSync() {
      if (this.cloudSyncEnabled) return

      const auth = useAuthStore()
      if (!auth.isAuthenticated) return

      this.cloudSyncEnabled = true
      this.cloudSyncError = null

      // 首次启用时从云端加载数据
      await this.syncFromCloud()

      // 启动定时同步
      this.startSyncLoop()
    },

    async disableCloudSync() {
      this.cloudSyncEnabled = false
      if (syncTimer) {
        window.clearInterval(syncTimer)
        syncTimer = null
      }
    },

    startSyncLoop() {
      if (syncTimer) return
      syncTimer = window.setInterval(() => {
        if (this.cloudSyncEnabled && !isSyncing) {
          this.syncToCloud()
        }
      }, SYNC_INTERVAL)
    },

    debouncedSync() {
      if (syncTimer) {
        window.clearInterval(syncTimer)
      }
      syncTimer = window.setTimeout(() => {
        if (this.cloudSyncEnabled && !isSyncing) {
          this.syncToCloud()
        }
      }, 1000)
    },

    async syncFromCloud() {
      try {
        const result = await dataApi.getData()
        if (result.data) {
          this.data = normalizeData(result.data)
          this.dataVersion = result.version || 1
          saveJson(LS_KEY, this.data)
          localStorage.setItem(LS_VERSION_KEY, String(this.dataVersion))
        }
        this.cloudSyncError = null
      } catch (e: any) {
        console.error('Sync from cloud error:', e)
        this.cloudSyncError = e.message
      }
    },

    async syncToCloud() {
      if (isSyncing) return
      isSyncing = true

      try {
        const result = await dataApi.syncData(this.data, this.dataVersion)
        if (result.hasNewer) {
          // 服务器有更新的数据，覆盖本地
          this.data = normalizeData(result.data)
          this.dataVersion = result.version
          saveJson(LS_KEY, this.data)
          localStorage.setItem(LS_VERSION_KEY, String(this.dataVersion))
        } else {
          this.dataVersion = result.version
          localStorage.setItem(LS_VERSION_KEY, String(this.dataVersion))
        }
        this.cloudSyncError = null
      } catch (e: any) {
        console.error('Sync to cloud error:', e)
        this.cloudSyncError = e.message
      } finally {
        isSyncing = false
      }
    },

    saveGrowthConfig(next: GrowthConfig) {
      const maxLevel = Math.max(2, Math.floor(next.maxLevel || 10))
      const thresholds = Array.from({ length: maxLevel - 1 }, (_, i) => {
        const v = Number(next.thresholds?.[i] ?? 0)
        return Number.isFinite(v) && v > 0 ? Math.floor(v) : 40 + i * 20
      })
      const badgeEveryExp = Math.max(1, Math.floor(Number(next.badgeEveryExp || 200)))
      this.data.growth = { thresholds, maxLevel, badgeEveryExp }
      this.persist()
    },
    setActiveClassroom(id: string) {
      this.data.activeClassroomId = id
      this.persist()
    },
    addClassroom(name: string) {
      const trimmed = name.trim()
      if (!trimmed) return
      const id = newId('c')
      this.data.classrooms.push({ id, name: trimmed, students: [] })
      this.data.activeClassroomId = id
      this.persist()
    },
    updateClassroomName(classroomId: string, name: string) {
      const trimmed = name.trim()
      if (!trimmed) return false
      const c = this.data.classrooms.find((x) => x.id === classroomId)
      if (!c) return false
      c.name = trimmed
      this.persist()
      return true
    },
    removeClassroom(classroomId: string) {
      if (this.data.classrooms.length <= 1) return false
      const idx = this.data.classrooms.findIndex((x) => x.id === classroomId)
      if (idx < 0) return false

      const removedId = this.data.classrooms[idx].id
      this.data.classrooms.splice(idx, 1)

      if (this.data.activeClassroomId === removedId) {
        this.data.activeClassroomId = this.data.classrooms[0]?.id ?? ''
      }

      this.data.records = this.data.records.filter((r) => r.classroomId !== removedId)
      this.data.shopRecords = this.data.shopRecords.filter((r) => r.classroomId !== removedId)

      this.persist()
      return true
    },
    addStudentToActiveClassroom(name: string, number?: string) {
      const c = this.activeClassroom
      if (!c) return
      const trimmedName = name.trim()
      const trimmedNumber = (number ?? '').trim()
      if (!trimmedName) return

      if (trimmedNumber && !/^\d+$/.test(trimmedNumber)) return

      const exists = trimmedNumber
        ? c.students.some((s) => (s.number ?? '').trim() === trimmedNumber)
        : false
      if (exists) return

      c.students.push({
        id: newId('s'),
        name: trimmedName,
        number: trimmedNumber || undefined,
        points: 0,
        badges: 0,
      })
      this.persist()
    },
    updateStudentInActiveClassroom(studentId: string, patch: { name?: string; number?: string | null }) {
      const c = this.activeClassroom
      if (!c) return false
      const s = c.students.find((x) => x.id === studentId)
      if (!s) return false

      const nextName = patch.name !== undefined ? patch.name.trim() : s.name
      const nextNumberRaw = patch.number !== undefined ? (patch.number ?? '').trim() : (s.number ?? '').trim()
      const nextNumber = nextNumberRaw || undefined

      if (!nextName) return false
      if (nextNumber && !/^\d+$/.test(nextNumber)) return false
      if (nextNumber) {
        const dup = c.students.some((x) => x.id !== studentId && (x.number ?? '').trim() === nextNumber)
        if (dup) return false
      }

      s.name = nextName
      s.number = nextNumber
      this.persist()
      return true
    },
    removeStudentFromActiveClassroom(studentId: string) {
      const c = this.activeClassroom
      if (!c) return
      const idx = c.students.findIndex((x) => x.id === studentId)
      if (idx < 0) return
      c.students.splice(idx, 1)
      this.data.records = this.data.records.filter((r) => r.studentId !== studentId || r.classroomId !== c.id)
      this.persist()
    },
    bulkImportStudentsToActiveClassroom(lines: string) {
      const c = this.activeClassroom
      if (!c) return 0
      const existedNumbers = new Set(c.students.map((s) => (s.number ?? '').trim()).filter(Boolean))

      const added: { name: string; number?: string }[] = []
      const rawLines = lines.split(/\r?\n/)
      for (const raw of rawLines) {
        const t = raw.trim()
        if (!t) continue
        const parts = t.split(/\s+/).filter(Boolean)
        const name = parts[0]?.trim()
        const number = parts[1]?.trim()
        if (!name) continue
        if (number && !/^\d+$/.test(number)) continue
        if (number && existedNumbers.has(number)) continue
        added.push({ name, number: number || undefined })
        if (number) existedNumbers.add(number)
      }

      for (const s of added) this.addStudentToActiveClassroom(s.name, s.number)
      return added.length
    },
    openModal(modal: NonNullable<(typeof this.ui)['modal']>, studentId?: string) {
      this.ui.modal = modal
      this.ui.modalStudentId = studentId ?? null
      this.ui.modalStudentIds = studentId ? [studentId] : []
    },
    openModalForStudents(modal: NonNullable<(typeof this.ui)['modal']>, studentIds: string[]) {
      this.ui.modal = modal
      const unique = Array.from(new Set(studentIds)).filter(Boolean)
      this.ui.modalStudentIds = unique
      this.ui.modalStudentId = unique[0] ?? null
    },
    closeModal() {
      this.ui.modal = null
      this.ui.modalStudentId = null
      this.ui.modalStudentIds = []
    },
    setActiveView(view: 'classroom' | 'leaderboard' | 'shop' | 'records' | 'settings' | 'classManager') {
      this.activeView = view
    },
    enterBatchMode() {
      this.ui.batchMode = true
      this.ui.batchAction = 'score'
      this.ui.selectedStudentIds = []
    },
    exitBatchMode() {
      this.ui.batchMode = false
      this.ui.selectedStudentIds = []
    },
    setBatchAction(action: 'score' | 'adopt') {
      this.ui.batchAction = action
      const c = this.activeClassroom
      if (!c) return
      const allowed = new Set<string>()
      for (const s of c.students) {
        if (action === 'score' && s.pet) allowed.add(s.id)
        if (action === 'adopt' && !s.pet) allowed.add(s.id)
      }
      this.ui.selectedStudentIds = this.ui.selectedStudentIds.filter((id) => allowed.has(id))
    },
    toggleSelectStudent(id: string) {
      const c = this.activeClassroom
      if (!c) return
      const s = c.students.find((x) => x.id === id)
      if (!s) return
      if (this.ui.batchAction === 'score' && !s.pet) return
      if (this.ui.batchAction === 'adopt' && s.pet) return

      const set = new Set(this.ui.selectedStudentIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      this.ui.selectedStudentIds = Array.from(set)
    },
    clearSelection() {
      this.ui.selectedStudentIds = []
    },
    toggleCardViewMode() {
      this.ui.cardViewMode = this.ui.cardViewMode === 'large' ? 'mini' : 'large'
    },
    selectAllFiltered() {
      const c = this.activeClassroom
      if (!c) return
      const filteredIds = (this as any).filteredStudents.map((s: { id: string }) => s.id)
      const setFiltered = new Set(filteredIds)
      const allowed = c.students
        .filter((s) => setFiltered.has(s.id))
        .filter((s) => (this.ui.batchAction === 'score' ? !!s.pet : !s.pet))
        .map((s) => s.id)
      this.ui.selectedStudentIds = Array.from(new Set(allowed))
    },
    adoptPet(studentId: string, petId: PetId, petName: string) {
      const c = this.activeClassroom
      if (!c) return
      const s = c.students.find((x) => x.id === studentId)
      if (!s) return
      if (s.pet) s.points = 0
      s.pet = { petId, name: petName, level: 1, exp: 0 }
      this.persist()
    },
    adoptPetForStudents(studentIds: string[], petId: PetId, petName: string, onlyIfNoPet = true) {
      const c = this.activeClassroom
      if (!c) return
      const set = new Set(studentIds)
      for (const s of c.students) {
        if (!set.has(s.id)) continue
        if (onlyIfNoPet && s.pet) continue
        if (s.pet) s.points = 0
        s.pet = { petId, name: petName, level: 1, exp: 0 }
      }
      this.persist()
    },
    applyRule(studentId: string, rule: ScoreRule) {
      const c = this.activeClassroom
      if (!c) return
      const s = c.students.find((x) => x.id === studentId)
      if (!s) return

      const curPoints = Number((s as any).points)
      if (!Number.isFinite(curPoints)) (s as any).points = 0
      else (s as any).points = curPoints

      const before = {
        points: s.points,
        badges: s.badges,
        pet: s.pet ? { ...s.pet } : undefined,
      }

      const delta = rule.delta
      const fx = delta >= 0 ? ('plus' as const) : ('minus' as const)
      const ts = Date.now()
      this.ui.scoreFx = { studentId: s.id, kind: fx, ts }
      globalThis.setTimeout(() => {
        if (this.ui.scoreFx?.ts === ts) this.ui.scoreFx = null
      }, 900)

      s.points = Math.max(0, Math.floor(s.points + delta))

      if (delta > 0 && s.pet) {
        const beforeLv = s.pet.level
        s.pet.exp += delta
        const maxLv = this.data.growth.maxLevel
        while (s.pet.level < maxLv && s.pet.exp >= this.expNeed(s.pet.level)) {
          s.pet.exp -= this.expNeed(s.pet.level)
          s.pet.level += 1
        }
        while (s.pet.level >= maxLv && s.pet.exp >= this.expNeed(maxLv)) {
          s.pet.exp -= this.expNeed(maxLv)
          s.badges += 1
        }

        if (s.pet.level > beforeLv) {
          const lvTs = Date.now()
          this.ui.levelUp = { studentId: s.id, studentName: s.name, petId: s.pet.petId, level: s.pet.level, ts: lvTs }
        }
      }

      this.data.records.unshift({
        id: newId('rec'),
        ts: Date.now(),
        classroomId: c.id,
        studentId: s.id,
        kind: delta >= 0 ? 'plus' : 'minus',
        delta,
        ruleTitle: rule.title,
        category: rule.category,
        before,
      })

      this.persist()
    },
    closeLevelUp() {
      this.ui.levelUp = null
    },
    undoScoreRecord(recordId: string) {
      const idx = this.data.records.findIndex((r) => r.id === recordId)
      if (idx < 0) return { ok: false as const, reason: '记录不存在' }
      const r = this.data.records[idx]
      if (!r.before) return { ok: false as const, reason: '该记录不支持撤回（旧版本数据）' }

      const c = this.data.classrooms.find((x) => x.id === r.classroomId)
      if (!c) return { ok: false as const, reason: '班级不存在' }
      const s = c.students.find((x) => x.id === r.studentId)
      if (!s) return { ok: false as const, reason: '学生不存在' }

      s.points = r.before.points
      s.badges = r.before.badges
      if (r.before.pet) s.pet = { ...r.before.pet }
      else delete (s as any).pet

      this.data.records.splice(idx, 1)
      this.persist()
      return { ok: true as const }
    },
    undoLatestScoreRecord(classroomId?: string) {
      const c = this.activeClassroom
      if (!c) return { ok: false as const, reason: '没有活跃班级' }
      const cid = classroomId ?? c.id
      const r = this.data.records.find((x) => x.classroomId === cid)
      if (!r) return { ok: false as const, reason: '暂无可撤回的记录' }
      return this.undoScoreRecord(r.id)
    },
    applyRuleForStudents(studentIds: string[], rule: ScoreRule) {
      for (const id of studentIds) this.applyRule(id, rule)
    },
    redeemShopItem(studentId: string, itemId: string) {
      const c = this.activeClassroom
      if (!c) return { ok: false as const, reason: '没有活跃班级' }
      const s = c.students.find((x) => x.id === studentId)
      const item = this.data.shopItems.find((x) => x.id === itemId)
      if (!s || !item) return { ok: false as const, reason: '无效的学生或商品' }
      if (!item.enabled) return { ok: false as const, reason: '商品已停用' }
      if (item.stock === 0) return { ok: false as const, reason: '库存不足' }
      if (s.badges < item.priceBadges) return { ok: false as const, reason: '徽章不足' }

      s.badges -= item.priceBadges
      if (item.stock > 0) item.stock -= 1

      this.data.shopRecords.unshift({
        id: newId('shoprec'),
        ts: Date.now(),
        classroomId: c.id,
        studentId: s.id,
        itemId: item.id,
        itemTitle: item.title,
        costBadges: item.priceBadges,
        status: 'success',
      })
      this.persist()
      return { ok: true as const }
    },
    upsertShopItem(patch: Partial<ShopItem> & { id?: string }) {
      const id = patch.id ?? newId('item')
      const existing = this.data.shopItems.find((x) => x.id === id)
      if (existing) {
        Object.assign(existing, patch, { id })
      } else {
        this.data.shopItems.unshift({
          id,
          title: patch.title ?? '新商品',
          description: patch.description ?? '',
          priceBadges: patch.priceBadges ?? 1,
          stock: patch.stock ?? 10,
          category: (patch.category ?? '杂项') as ShopItemCategory,
          icon: patch.icon ?? '🎁',
          enabled: patch.enabled ?? true,
        })
      }
      this.persist()
      return id
    },
    removeShopItem(itemId: string) {
      const idx = this.data.shopItems.findIndex((x) => x.id === itemId)
      if (idx < 0) return
      this.data.shopItems.splice(idx, 1)
      this.persist()
    },
    upsertScoreRule(patch: Partial<ScoreRule> & { id?: string }) {
      const id = patch.id ?? newId('rule')
      const existing = this.data.rules.find((x) => x.id === id)
      const normalized: Partial<ScoreRule> = {
        ...patch,
        id,
        enabled: patch.enabled ?? true,
        icon: (patch as any).icon ?? existing?.icon ?? '⭐',
        scope: (patch as any).scope ?? existing?.scope ?? 'all',
      }
      if (existing) {
        Object.assign(existing, normalized)
      } else {
        this.data.rules.unshift({
          id,
          title: patch.title ?? '新指标',
          delta: typeof patch.delta === 'number' ? patch.delta : 1,
          category: (patch.category ?? '学习') as ScoreCategory,
          enabled: patch.enabled ?? true,
          icon: (patch as any).icon ?? '⭐',
          scope: (patch as any).scope ?? 'all',
        })
      }
      this.persist()
      return id
    },
    removeScoreRule(ruleId: string) {
      const idx = this.data.rules.findIndex((x) => x.id === ruleId)
      if (idx < 0) return
      this.data.rules.splice(idx, 1)
      this.persist()
    },
    exportData(): string {
      return JSON.stringify(this.data, null, 2)
    },
    importData(json: string) {
      const parsed = JSON.parse(json) as AppData
      if (!parsed || parsed.version !== 1) throw new Error('不支持的数据版本')
      this.data = normalizeData(parsed)
      this.persist()
    },
    resetData() {
      this.data = initialData()
      this.persist()
    },

    // 自动备份相关方法
    async refreshAutoBackupTarget() {
      try {
        const handle = await getSavedHandle()
        this.ui.autoBackupHasTarget = !!handle
        this.ui.autoBackupTargetName = handle?.name ?? ''
      } catch {
        this.ui.autoBackupHasTarget = false
        this.ui.autoBackupTargetName = ''
      }
    },

    async setAutoBackupEnabled(enabled: boolean) {
      this.ui.autoBackupEnabled = enabled
      saveJson(LS_PREF_AUTO_BACKUP, enabled)
      if (enabled) {
        await this.runAutoBackupOnce()
      }
    },

    async pickAutoBackupFile() {
      const handle = await pickTargetFile()
      this.ui.autoBackupHasTarget = true
      this.ui.autoBackupTargetName = handle.name
      await this.runAutoBackupOnce()
    },

    async runAutoBackupOnce() {
      if (autoBackupRunning) return
      autoBackupRunning = true
      try {
        const json = this.exportData()
        await writeBackupJson(json)
        this.ui.autoBackupLastOkAt = Date.now()
        this.ui.autoBackupLastError = null
      } catch (e: any) {
        this.ui.autoBackupLastError = e.message
      } finally {
        autoBackupRunning = false
      }
    },

    async clearAutoBackupFile() {
      await clearSavedHandle()
      this.ui.autoBackupHasTarget = false
      this.ui.autoBackupTargetName = ''
    },

    setAutoBackupIntervalSec(sec: number) {
      this.ui.autoBackupIntervalSec = Math.max(10, Math.floor(sec))
      saveJson(LS_PREF_AUTO_BACKUP_INTERVAL, this.ui.autoBackupIntervalSec)
    },

    startAutoBackupLoop() {
      if (autoBackupTimer) return
      // 页面隐藏时自动备份
      const handleVisibility = async () => {
        if (document.hidden && this.ui.autoBackupEnabled && this.ui.autoBackupHasTarget) {
          await this.runAutoBackupOnce()
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)

      // 定时备份
      autoBackupTimer = window.setInterval(async () => {
        if (this.ui.autoBackupEnabled && this.ui.autoBackupHasTarget) {
          await this.runAutoBackupOnce()
        }
      }, this.ui.autoBackupIntervalSec * 1000)
    },

    stopAutoBackupLoop() {
      if (autoBackupTimer) {
        window.clearInterval(autoBackupTimer)
        autoBackupTimer = null
      }
    },
  },
})

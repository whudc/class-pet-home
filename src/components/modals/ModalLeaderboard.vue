<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreRecord } from '@/lib/models'
import ModalBase from '@/components/modals/ModalBase.vue'

defineProps<{ asView?: boolean }>()

const app = useAppStore()

// 榜单类型
type LeaderboardType = 'total' | 'week' | 'month' | 'custom' | 'group'
const activeType = ref<LeaderboardType>('total')

// 自定义时间范围
const customStartDate = ref('')
const customEndDate = ref('')

// 计算净分（根据记录计算加分减扣后的净值）
function calculateNetScore(studentId: string, records: ScoreRecord[]): number {
  return records
    .filter(r => r.studentId === studentId)
    .reduce((sum, r) => sum + r.delta, 0)
}

// 获取指定时间范围内的记录
function getRecordsInTimeRange(records: ScoreRecord[], start: number, end: number): ScoreRecord[] {
  return records.filter(r => r.ts >= start && r.ts <= end)
}

// 获取本周记录（周一 00:00 起）
function getWeekRecords(records: ScoreRecord[]): ScoreRecord[] {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7 // 周日为 0，转为 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  return getRecordsInTimeRange(records, monday.getTime(), now.getTime())
}

// 获取本月记录（每月 1 日 00:00 起）
function getMonthRecords(records: ScoreRecord[]): ScoreRecord[] {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)
  return getRecordsInTimeRange(records, firstDay.getTime(), now.getTime())
}

// 获取自定义时间范围记录
function getCustomRecords(records: ScoreRecord[]): ScoreRecord[] {
  if (!customStartDate.value || !customEndDate.value) return []
  const start = new Date(customStartDate.value).getTime()
  const end = new Date(customEndDate.value).getTime() + 24 * 60 * 60 * 1000 - 1
  return getRecordsInTimeRange(records, start, end)
}

// 排行榜数据
const leaderboardData = computed(() => {
  const classroom = app.activeClassroom
  if (!classroom) return []

  const students = classroom.students ?? []
  const allRecords = app.data.records.filter(r => r.classroomId === classroom.id)

  // 根据榜单类型获取对应的记录
  let timeRangeRecords: ScoreRecord[]
  switch (activeType.value) {
    case 'week':
      timeRangeRecords = getWeekRecords(allRecords)
      break
    case 'month':
      timeRangeRecords = getMonthRecords(allRecords)
      break
    case 'custom':
      timeRangeRecords = getCustomRecords(allRecords)
      break
    default:
      timeRangeRecords = allRecords
  }

  // 计算每个学生的净分
  const studentScores = students.map(s => {
    const netScore = calculateNetScore(s.id, timeRangeRecords)
    // 可用积分 = 当前余额（points）
    const availablePoints = s.points ?? 0
    return {
      student: s,
      badges: s.badges ?? 0,
      netScore,
      availablePoints,
      // 总榜排序：先按徽章，再按净分
      totalSortKey: (s.badges ?? 0) * 10000 + netScore,
    }
  })

  // 排序
  return studentScores.sort((a, b) => {
    if (activeType.value === 'total') {
      // 总榜：先按徽章数，再按净分
      const byBadges = b.badges - a.badges
      if (byBadges !== 0) return byBadges
      return b.netScore - a.netScore
    }
    // 其他榜单：按净分排序
    return b.netScore - a.netScore
  })
})

// 获取排名样式
function getRankStyle(idx: number): string {
  if (idx === 0) return 'bg-amber-500 text-white'
  if (idx === 1) return 'bg-slate-300 text-white'
  if (idx === 2) return 'bg-amber-700 text-white'
  return 'bg-slate-100 text-slate-600'
}

// 获取宠物头像背景色
function getPetAvatarBg(petId?: string): string {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
  ]
  if (!petId) return 'bg-gradient-to-br from-slate-300 to-slate-400'
  const hash = petId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function handleClose() {
  app.setActiveView('classroom')
}
</script>

<template>
  <ModalBase :as-view @close="handleClose">
    <template #title>🏆 光荣榜 <span class="chip-en">HONOR ROLL</span></template>

    <!-- 说明文字 -->
    <div class="mb-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-500">
      <div class="leading-relaxed">
        <span class="font-medium text-slate-600">排序规则：</span>
        <span>总榜按徽章数量与净分排序；周榜按本周净分排序（周一 00:00 起）；月榜按本月净分排序（每月 1 日 00:00 起）；自定义可按选择的时间范围查看净分排行；小组 PK 按净分排序。</span>
      </div>
      <div class="mt-1 text-slate-400">
        <span>净分 = 累计得分（加分减扣分后的净值）；可用积分 = 当前余额，可在小卖部兑换奖励。</span>
      </div>
    </div>

    <!-- 榜单类型切换 -->
    <div class="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1">
      <button
        v-for="tab in [
          { key: 'total' as LeaderboardType, label: '总榜' },
          { key: 'week' as LeaderboardType, label: '周榜' },
          { key: 'month' as LeaderboardType, label: '月榜' },
          { key: 'custom' as LeaderboardType, label: '自定义' },
          { key: 'group' as LeaderboardType, label: '小组 PK' },
        ]"
        :key="tab.key"
        class="flex-1 rounded-xl px-2 py-2 text-sm font-medium transition"
        :class="activeType === tab.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        @click="activeType = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 自定义时间范围选择器 -->
    <div v-if="activeType === 'custom'" class="mb-4 flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3">
      <span class="text-sm text-slate-600">从</span>
      <input v-model="customStartDate" type="date" class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <span class="text-sm text-slate-600">至</span>
      <input v-model="customEndDate" type="date" class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </div>

    <!-- 排行榜列表 -->
    <div class="space-y-2">
      <div
        v-for="(item, idx) in leaderboardData"
        :key="item.student.id"
        class="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/50 to-transparent px-4 py-3 transition hover:border-amber-200 hover:shadow-sm"
      >
        <div class="flex items-center gap-3">
          <!-- 排名 -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="getRankStyle(idx)"
          >
            {{ idx + 1 }}
          </div>

          <!-- 学生头像和信息 -->
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div
              class="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm"
              :class="getPetAvatarBg(item.student.pet?.petId)"
            >
              <img
                v-if="item.student.pet"
                :src="`/pets/${item.student.pet.petId}.png`"
                :alt="item.student.pet.name"
                class="h-full w-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-xl text-white">
                {{ item.student.name.charAt(0) }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-base font-semibold text-slate-800">{{ item.student.name }}</span>
                <span v-if="item.student.pet" class="text-xs text-slate-400">
                  {{ item.student.pet.name }}·{{ ['幼年', '青年', '成年', '成熟', '完全'][Math.min(4, Math.floor((item.student.pet.level - 1) / 2))] }}
                </span>
              </div>
            </div>
          </div>

          <!-- 分数信息 -->
          <div class="flex shrink-0 flex-col items-end gap-1 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">徽章</span>
              <span class="font-medium text-slate-600">{{ item.badges }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">净分</span>
              <span class="font-semibold" :class="item.netScore >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ item.netScore >= 0 ? '+' : '' }}{{ item.netScore }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">可用积分</span>
              <span class="font-medium text-indigo-600">{{ item.availablePoints }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="leaderboardData.length === 0" class="py-12 text-center">
      <div class="text-4xl">📊</div>
      <div class="mt-3 text-sm text-slate-500">暂无数据</div>
    </div>
  </ModalBase>
</template>

<style scoped>
.chip-en {
  @apply ml-2 text-xs font-normal text-slate-400;
}
</style>

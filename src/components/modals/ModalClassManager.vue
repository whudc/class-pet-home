<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'

defineProps<{ asView?: boolean }>()

const app = useAppStore()
const activeTab = ref<'class' | 'student' | 'group'>('class')

// ========== 班级管理 ==========
const showAddClassInput = ref(false)
const newClassName = ref('')
const editingClassId = ref<string | null>(null)
const editClassName = ref('')

function toggleAddClass() {
  if (showAddClassInput.value) {
    newClassName.value = ''
  }
  showAddClassInput.value = !showAddClassInput.value
}

function addClassroom() {
  if (!newClassName.value.trim()) return
  app.addClassroom(newClassName.value)
  newClassName.value = ''
  showAddClassInput.value = false
}

function startEditClassroom(id: string) {
  const c = app.data.classrooms.find((x) => x.id === id)
  if (!c) return
  editingClassId.value = id
  editClassName.value = c.name
}

function cancelEditClassroom() {
  editingClassId.value = null
  editClassName.value = ''
}

function saveEditClassroom() {
  if (!editingClassId.value) return
  app.updateClassroomName(editingClassId.value, editClassName.value)
  editingClassId.value = null
}

function removeClassroom(id: string) {
  const c = app.data.classrooms.find((x) => x.id === id)
  if (!c) return
  if (app.data.classrooms.length <= 1) {
    alert('至少需要保留 1 个班级')
    return
  }
  if (!confirm(`确定要删除「${c.name}」吗？该班级的学生与相关记录将一并清理。此操作不可逆。`)) return
  const ok = app.removeClassroom(id)
  if (!ok) alert('删除失败：至少需要保留 1 个班级')
  if (editingClassId.value === id) cancelEditClassroom()
}

function setActive(id: string) {
  if (editingClassId.value === id) return
  app.setActiveClassroom(id)
}

// ========== 学生管理 ==========
const active = computed(() => app.activeClassroom)
const studentCount = computed(() => active.value?.students?.length ?? 0)

const showAdd = ref(false)
const newStudentName = ref('')
const newStudentNumber = ref('')
const formMsg = ref<string | null>(null)

const showImport = ref(false)
const importText = ref('')
const importMsg = ref<string | null>(null)

const studentsSorted = computed(() => {
  const list = [...(active.value?.students ?? [])]
  const num = (s: { number?: string }) => {
    const n = Number.parseInt(s.number ?? '', 10)
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
  }
  return list.sort((a, b) => num(a) - num(b))
})

const editingId = ref<string | null>(null)
const editName = ref('')
const editNumber = ref('')

function openEdit(id: string) {
  const s = active.value?.students?.find((x) => x.id === id)
  if (!s) return
  editingId.value = id
  editName.value = s.name
  editNumber.value = s.number ?? ''
  formMsg.value = null
}

function saveEdit() {
  if (!editingId.value) return
  const ok = app.updateStudentInActiveClassroom(editingId.value, { name: editName.value, number: editNumber.value })
  if (!ok) {
    formMsg.value = '保存失败：请检查姓名是否为空，学号是否为纯数字且不重复'
    return
  }
  editingId.value = null
}

function removeStudent(id: string) {
  if (!confirm('确定要删除该学生吗？（相关评价记录也会一并清理）')) return
  app.removeStudentFromActiveClassroom(id)
}

function addStudent() {
  formMsg.value = null
  const students = active.value?.students ?? []
  const before = students.length
  app.addStudentToActiveClassroom(newStudentName.value, newStudentNumber.value)
  const after = students.length
  if (after === before) {
    formMsg.value = '添加失败：请检查姓名是否为空，学号是否为纯数字且不重复'
    return
  }
  newStudentName.value = ''
  newStudentNumber.value = ''
  showAdd.value = false
}

function startImport() {
  const n = app.bulkImportStudentsToActiveClassroom(importText.value)
  importMsg.value = `已导入 ${n} 位学生`
  importText.value = ''
  showImport.value = false
}

function clearAllPoints() {
  if (!confirm('确定要清空所有学生的积分吗？此操作不可逆。')) return
  app.clearAllPoints()
}

function goToClassroom() {
  app.setActiveView('classroom')
  if (props.asView) return
  handleClose()
}

function randomAssignPet() {
  window.alert('随机分配幻兽功能待实现')
}

function handleClose() {
  app.setActiveView('classroom')
}
</script>

<template>
  <ModalBase :as-view @close="handleClose">
    <template #title>🏫 班级管理</template>

    <!-- 顶部 Tab -->
    <div class="tabs-container">
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'class' }" @click="activeTab = 'class'">
          班级管理
        </button>
        <button class="tab" :class="{ active: activeTab === 'student' }" @click="activeTab = 'student'">
          学生管理
        </button>
        <button class="tab" :class="{ active: activeTab === 'group' }" @click="activeTab = 'group'">
          分组管理
        </button>
      </div>
    </div>

    <!-- 班级管理 Tab -->
    <div v-show="activeTab === 'class'" class="tab-content">
      <div class="section-card">
        <h2 class="section-title">班级管理</h2>
        <div class="class-actions">
          <button class="action-btn" @click="toggleAddClass">新建班级</button>
          <button class="action-btn" :disabled="!active" @click="startEditClassroom(active.id)">重命名班级</button>
          <button class="action-btn danger" :disabled="app.data.classrooms.length <= 1" @click="removeClassroom(active!.id)">删除班级</button>
        </div>

        <!-- 新建班级输入框 -->
        <div v-if="showAddClassInput" class="mt-4 flex items-center gap-2">
          <input v-model="newClassName" class="input flex-1" placeholder="输入班级名称…" />
          <button class="action-btn-sm primary" :disabled="!newClassName.trim()" @click="addClassroom">确认</button>
          <button class="action-btn-sm" @click="toggleAddClass">取消</button>
        </div>

        <!-- 重命名班级输入框 -->
        <div v-if="editingClassId" class="mt-4 flex items-center gap-2">
          <input v-model="editClassName" class="input flex-1" placeholder="输入新班级名称…" />
          <button class="action-btn-sm primary" :disabled="!editClassName.trim()" @click="saveEditClassroom">确认</button>
          <button class="action-btn-sm" @click="cancelEditClassroom">取消</button>
        </div>

        <div class="current-class mt-4">
          {{ active?.name }} <span class="current-tag">当前</span>
        </div>
      </div>
    </div>

    <!-- 学生管理 Tab -->
    <div v-show="activeTab === 'student'" class="tab-content">
      <div class="student-layout">
        <!-- 左侧：添加学生 -->
        <div class="left-panel">
          <h3 class="panel-title">添加学生</h3>
          <div class="add-form">
            <input v-model="newStudentName" class="input" placeholder="学生姓名（必填）" />
            <input v-model="newStudentNumber" class="input" placeholder="学号（选填）" />
            <select class="input select">
              <option>性别未设置</option>
              <option>男</option>
              <option>女</option>
            </select>
            <button class="add-btn" :disabled="!newStudentName.trim()" @click="addStudent">添加</button>
          </div>

          <h3 class="panel-title mt-6">批量添加</h3>
          <textarea
            v-model="importText"
            class="textarea"
            rows="6"
            placeholder="一行一个姓名，或用逗号分隔"
          />
          <div class="batch-actions">
            <button class="batch-btn" @click="startImport">批量添加</button>
            <button class="batch-btn excel">Excel 导入</button>
          </div>
        </div>

        <!-- 右侧：学生列表 -->
        <div class="right-panel">
          <div class="panel-header">
            <div class="panel-title-inline">
              当前学生 <span class="count">({{ studentCount }}/100)</span>
            </div>
            <div class="panel-actions">
              <button class="link-btn" :disabled="!active" @click="clearAllPoints">重置积分</button>
              <button class="link-btn">批量管理</button>
            </div>
          </div>
          <div class="student-list-compact">
            <div v-for="s in studentsSorted" :key="s.id" class="student-item-compact">
              <span class="student-name">{{ s.name }}</span>
              <div class="student-actions-compact">
                <button class="action-link" @click="openEdit(s.id)">编辑</button>
                <button class="action-link" @click="clearAllPoints">清零</button>
                <button class="action-link danger" @click="removeStudent(s.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 幻兽分配方式 -->
      <div class="section-card mt-4">
        <h3 class="panel-title mb-4">幻兽分配方式</h3>
        <div class="pet-distribute-grid">
          <div class="pet-option">
            <div class="pet-option-header">
              <span class="pet-icon">🐲</span>
              <span class="pet-title">玩法一：学生自己选</span>
            </div>
            <p class="pet-desc">在班级主页打开投屏，让学生点击自己卡片上的「领养」按钮挑选心仪的幻兽</p>
            <button class="pet-btn" @click="goToClassroom">前往班级主页</button>
          </div>
          <div class="pet-option">
            <div class="pet-option-header">
              <span class="pet-icon">🎲</span>
              <span class="pet-title">玩法二：老师随机分配</span>
            </div>
            <p class="pet-desc">一键为全班学生随机分配幻兽，快速开启养成之旅</p>
            <button class="pet-btn outline" @click="randomAssignPet">一键随机分配</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分组管理 Tab -->
    <div v-show="activeTab === 'group'" class="tab-content">
      <div class="section-card">
        <div class="group-header">
          <h2 class="section-title mb-0">分组管理</h2>
          <div class="group-actions">
            <span class="text-sm text-slate-500">当前方案</span>
            <div class="select-wrapper">
              <select class="group-select">
                <option>默认分组</option>
              </select>
            </div>
            <button class="action-btn-sm">+ 新建方案</button>
            <button class="action-btn-sm">重命名</button>
            <button class="action-btn-sm danger">删除方案</button>
            <button class="action-btn-sm primary">+ 新建小组</button>
          </div>
        </div>
        <p class="group-desc">
          不同分组方案相互独立：同一学生在不同方案中可各属一个小组。首页、光荣榜与工具会共用你选中的「当前方案」（在对应页面也可切换）。
        </p>
        <div class="group-empty">
          当前方案下暂无小组，点击「+ 新建小组」开始分组
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
/* Tabs */
.tabs-container {
  @apply mb-4;
}
.tabs {
  @apply flex items-center gap-2 bg-slate-100 rounded-2xl p-1;
}
.tab {
  @apply flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-slate-500 hover:text-slate-700 transition;
}
.tab.active {
  @apply bg-white text-slate-900 shadow-sm;
}

/* Content */
.tab-content {
  @apply space-y-4;
}

/* Section Card */
.section-card {
  @apply rounded-3xl border border-slate-100 bg-white p-6;
}
.section-title {
  @apply text-lg font-semibold text-slate-800 mb-4;
}

/* Class Actions */
.class-actions {
  @apply flex items-center gap-2 mb-4;
}
.action-btn {
  @apply px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.action-btn.danger {
  @apply text-rose-500 border-rose-200 hover:bg-rose-50;
}
.action-btn-sm {
  @apply px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.action-btn-sm.primary {
  @apply bg-orange-500 text-white border-orange-500 hover:bg-orange-600;
}
.action-btn-sm.danger {
  @apply text-rose-500 border-rose-200 hover:bg-rose-50;
}

/* Current Class */
.current-class {
  @apply rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-600;
}
.current-tag {
  @apply ml-2 text-xs rounded-full bg-orange-200 px-2 py-0.5;
}

/* Student Layout */
.student-layout {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
}
.left-panel, .right-panel {
  @apply rounded-3xl border border-slate-100 bg-white p-5;
}
.panel-title {
  @apply text-base font-semibold text-slate-800 mb-3;
}
.panel-title-inline {
  @apply text-base font-semibold text-slate-800;
}
.count {
  @apply text-slate-400;
}

/* Add Form */
.add-form {
  @apply space-y-3;
}
.input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm;
}
.select {
  @apply cursor-pointer;
}
.select-sm {
  @apply w-auto;
}
.add-btn {
  @apply w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Textarea */
.textarea {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm resize-none;
}
.batch-actions {
  @apply flex items-center gap-2 mt-3;
}
.batch-btn {
  @apply px-4 py-2 rounded-xl text-sm font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 transition;
}
.batch-btn.excel {
  @apply bg-emerald-100 text-emerald-600 hover:bg-emerald-200;
}

/* Panel Header */
.panel-header {
  @apply flex items-center justify-between mb-4;
}
.panel-actions {
  @apply flex items-center gap-3;
}
.link-btn {
  @apply text-sm text-slate-500 hover:text-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Student List Compact */
.student-list-compact {
  @apply space-y-2 max-h-80 overflow-y-auto;
}
.student-item-compact {
  @apply flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50;
}
.student-name {
  @apply text-sm font-medium text-slate-700;
}
.student-actions-compact {
  @apply flex items-center gap-2;
}
.action-link {
  @apply text-xs text-orange-500 hover:text-orange-600 transition;
}
.action-link.danger {
  @apply text-rose-500 hover:text-rose-600;
}

/* Pet Distribute Grid */
.pet-distribute-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}
.pet-option {
  @apply rounded-2xl border border-orange-100 bg-orange-50/30 p-4;
}
.pet-option-header {
  @apply flex items-center gap-2 mb-2;
}
.pet-icon {
  @apply text-xl;
}
.pet-title {
  @apply text-sm font-semibold text-slate-800;
}
.pet-desc {
  @apply text-xs text-slate-500 mb-3;
}
.pet-btn {
  @apply w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition;
}
.pet-btn.outline {
  @apply bg-white border border-orange-200 text-orange-600 hover:bg-orange-50;
}

/* Group */
.group-header {
  @apply flex items-center justify-between mb-4 flex-wrap gap-3;
}
.group-header .section-title {
  @apply mb-0;
}
.group-actions {
  @apply flex flex-wrap items-center gap-3;
}
.select-wrapper {
  @apply relative;
}
.group-select {
  @apply rounded-lg border border-slate-200 bg-white px-8 py-1.5 text-sm text-slate-700 cursor-pointer hover:border-slate-300 transition appearance-none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
.group-desc {
  @apply text-xs text-slate-500 mb-6 mt-4;
}
.group-empty {
  @apply text-center text-sm text-slate-400 py-8;
}

/* Utils */
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
</style>

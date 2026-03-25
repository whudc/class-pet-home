<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreRule } from '@/lib/models'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()

const selectedIds = ref<Set<string>>(new Set())
const selectedRule = ref<ScoreRule | null>(null)

const students = computed(() => {
  const c = app.activeClassroom
  return c?.students ?? []
})

const categories = computed(() => {
  const set = new Set(app.data.rules.map((r) => r.category))
  return Array.from(set)
})

const activeCategory = ref(categories.value[0] || '学习')

const rulesInCategory = computed(() =>
  app.data.rules.filter((r) => r.enabled && r.category === activeCategory.value)
)

const allSelected = computed(() => {
  if (students.value.length === 0) return false
  return students.value.every((s) => selectedIds.value.has(s.id))
})

const selectedCount = computed(() => selectedIds.value.size)

function toggleStudent(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    for (const s of students.value) {
      selectedIds.value.add(s.id)
    }
  }
}

function pickRule(r: ScoreRule) {
  selectedRule.value = r
}

function confirmApply() {
  if (!selectedRule.value || selectedIds.value.size === 0) return
  const ids = Array.from(selectedIds.value)
  app.applyRuleForStudents(ids, selectedRule.value)
  handleClose()
}

function handleClose() {
  app.closeModal()
  selectedIds.value.clear()
  selectedRule.value = null
}
</script>

<template>
  <ModalBase @close="handleClose">
    <template #title>👨‍👩‍👧 全班操作 <span class="chip-en">ALL CLASS</span></template>

    <div class="modal-col">
      <!-- 学生列表区域 -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-slate-700">选择学生</h3>
          <button class="select-all-btn" @click="toggleAll">
            {{ allSelected ? '取消全选' : '全选' }}
          </button>
        </div>

        <div class="student-list">
          <div
            v-for="s in students"
            :key="s.id"
            class="student-item"
            :class="{ selected: selectedIds.has(s.id) }"
            @click="toggleStudent(s.id)"
          >
            <div class="check-box" :class="{ checked: selectedIds.has(s.id) }">
              <span v-if="selectedIds.has(s.id)">✓</span>
            </div>
            <div class="student-info">
              <div class="student-name">{{ s.name }}</div>
              <div class="student-meta">
                <span v-if="s.number" class="student-number">{{ s.number }}</span>
                <span v-if="s.pet" class="pet-level">Lv.{{ s.pet.level }}</span>
                <span v-else class="no-pet">未领养</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-2 text-xs text-slate-500">
          已选择 <span class="font-semibold text-brand-600">{{ selectedCount }}</span> 名学生
        </div>
      </div>

      <!-- 规则选择区域 -->
      <div class="rule-section">
        <h3 class="text-sm font-medium text-slate-700 mb-3">选择加分/扣分规则</h3>

        <div class="flex items-center gap-2 mb-3 overflow-auto">
          <button
            v-for="c in categories"
            :key="c"
            class="tab"
            :class="{ active: activeCategory === c }"
            @click="activeCategory = c"
          >
            {{ c }}
          </button>
        </div>

        <div class="rule-grid">
          <button
            v-for="r in rulesInCategory"
            :key="r.id"
            class="rule-card"
            :class="{ selected: selectedRule?.id === r.id }"
            @click="pickRule(r)"
          >
            <div class="rule-icon">{{ r.icon || '⭐' }}</div>
            <div class="rule-content">
              <div class="rule-title">{{ r.title }}</div>
              <div class="rule-delta" :class="r.delta >= 0 ? 'plus' : 'minus'">
                {{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}
              </div>
            </div>
          </button>
        </div>

        <div v-if="rulesInCategory.length === 0" class="text-slate-500 text-sm py-6 text-center">
          当前分类没有启用的规则
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="mt-6 flex items-center justify-between">
        <div v-if="selectedRule" class="text-sm text-slate-600">
          已选规则：<span class="font-medium">{{ selectedRule.title }}</span>
          <span :class="selectedRule.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            ({{ selectedRule.delta >= 0 ? '+' : '' }}{{ selectedRule.delta }})
          </span>
        </div>
        <div v-else class="text-sm text-slate-400">请选择加分/扣分规则</div>

        <div class="flex gap-2">
          <button class="btn" @click="handleClose">取消</button>
          <button
            class="btn-primary"
            :disabled="selectedCount === 0 || !selectedRule"
            @click="confirmApply"
          >
            确认应用
          </button>
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.modal-col {
  @apply h-full flex flex-col min-h-0;
}

.select-all-btn {
  @apply text-sm text-brand-600 hover:text-brand-700 font-medium;
}

.student-list {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1;
}

.student-item {
  @apply flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white cursor-pointer transition;
}

.student-item:hover {
  @apply border-brand-200 bg-brand-50;
}

.student-item.selected {
  @apply border-brand-300 bg-brand-50;
}

.check-box {
  @apply h-5 w-5 rounded border border-slate-300 flex items-center justify-center text-xs text-white flex-shrink-0;
}

.check-box.checked {
  @apply bg-brand-500 border-brand-500;
}

.student-info {
  @apply min-w-0 flex-1;
}

.student-name {
  @apply text-sm font-medium truncate;
}

.student-meta {
  @apply text-xs text-slate-500 flex items-center gap-2;
}

.student-number {
  @apply px-1.5 py-0.5 bg-slate-100 rounded;
}

.pet-level {
  @apply text-brand-600;
}

.no-pet {
  @apply text-slate-400;
}

.rule-section {
  @apply flex-1 min-h-0 overflow-hidden flex flex-col;
}

.tab {
  @apply rounded-xl px-3 py-1.5 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition whitespace-nowrap;
}

.tab.active {
  @apply bg-brand-50 border-brand-300 text-brand-700;
}

.rule-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-64 p-1;
}

.rule-card {
  @apply flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-left transition cursor-pointer;
}

.rule-card:hover {
  @apply border-brand-200 bg-brand-50;
}

.rule-card.selected {
  @apply border-brand-400 bg-brand-100 ring-2 ring-brand-200;
}

.rule-icon {
  @apply text-2xl flex-shrink-0;
}

.rule-content {
  @apply flex-1 min-w-0;
}

.rule-title {
  @apply text-sm font-medium truncate;
}

.rule-delta {
  @apply text-xs font-semibold mt-0.5;
}

.rule-delta.plus {
  @apply text-emerald-600;
}

.rule-delta.minus {
  @apply text-rose-600;
}

.btn {
  @apply rounded-xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}

.btn-primary {
  @apply rounded-xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
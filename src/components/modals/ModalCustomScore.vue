<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreCategory, ScoreRuleScope } from '@/lib/models'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()

const ruleName = ref('')
const scoreValue = ref(1)
const isPositive = ref(true)
const category = ref<ScoreCategory>('学习')
const scope = ref<ScoreRuleScope>('all')
const selectedIcon = ref('⭐')

const categories: ScoreCategory[] = ['学习', '行为', '健康', '其他']

const iconOptions = [
  '⭐', '🌟', '✨', '💫', '🎯', '🏆', '🎖', '🏅',
  '👍', '👏', '💪', '🔥', '❤️', '💚', '💙', '💜',
  '📗', '📘', '📙', '📓', '✍️', '📝', '📖', '📚',
  '🎨', '🎵', '⚽', '🏀', '🚀', '💡', '🔑', '🎁',
]

const previewDelta = computed(() => {
  return isPositive.value ? Math.abs(scoreValue.value) : -Math.abs(scoreValue.value)
})

function togglePositive() {
  isPositive.value = !isPositive.value
}

function selectIcon(icon: string) {
  selectedIcon.value = icon
}

function handleSave() {
  const name = ruleName.value.trim()
  if (!name) {
    window.alert('请输入规则名称')
    return
  }

  app.upsertScoreRule({
    title: name,
    delta: previewDelta.value,
    category: category.value,
    icon: selectedIcon.value,
    scope: scope.value,
    enabled: true,
  })

  // 重置表单
  ruleName.value = ''
  scoreValue.value = 1
  isPositive.value = true
  category.value = '学习'
  scope.value = 'all'
  selectedIcon.value = '⭐'

  window.alert('规则已保存')
  handleClose()
}

function handleClose() {
  app.closeModal()
}
</script>

<template>
  <ModalBase @close="handleClose">
    <template #title>⚙️ 自定义加分 <span class="chip-en">CUSTOM SCORE</span></template>

    <div class="form-container">
      <!-- 规则名称 -->
      <div class="form-group">
        <label class="form-label">规则名称</label>
        <input
          v-model="ruleName"
          type="text"
          class="form-input"
          placeholder="例如：课堂表现优秀"
        />
      </div>

      <!-- 分值设置 -->
      <div class="form-group">
        <label class="form-label">分值</label>
        <div class="score-input-group">
          <button class="toggle-btn" :class="{ positive: isPositive }" @click="togglePositive">
            {{ isPositive ? '➕ 加分' : '➖ 扣分' }}
          </button>
          <input
            v-model.number="scoreValue"
            type="number"
            min="1"
            max="99"
            class="score-input"
          />
          <span class="score-unit">分</span>
        </div>
        <div class="preview-text">
          预览：<span :class="previewDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ previewDelta >= 0 ? '+' : '' }}{{ previewDelta }}
          </span>
        </div>
      </div>

      <!-- 分类 -->
      <div class="form-group">
        <label class="form-label">分类</label>
        <div class="category-options">
          <button
            v-for="c in categories"
            :key="c"
            class="category-btn"
            :class="{ active: category === c }"
            @click="category = c"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <!-- 适用范围 -->
      <div class="form-group">
        <label class="form-label">适用范围</label>
        <div class="scope-options">
          <button
            class="scope-btn"
            :class="{ active: scope === 'all' }"
            @click="scope = 'all'"
          >
            🌐 所有班级
          </button>
          <button
            class="scope-btn"
            :class="{ active: scope === 'class' }"
            @click="scope = 'class'"
          >
            🏫 仅本班
          </button>
        </div>
      </div>

      <!-- 图标选择 -->
      <div class="form-group">
        <label class="form-label">选择图标</label>
        <div class="icon-grid">
          <button
            v-for="icon in iconOptions"
            :key="icon"
            class="icon-btn"
            :class="{ selected: selectedIcon === icon }"
            @click="selectIcon(icon)"
          >
            {{ icon }}
          </button>
        </div>
      </div>

      <!-- 预览卡片 -->
      <div class="preview-card">
        <div class="preview-label">效果预览</div>
        <div class="preview-rule-card">
          <div class="preview-icon">{{ selectedIcon }}</div>
          <div class="preview-content">
            <div class="preview-title">{{ ruleName || '规则名称' }}</div>
            <div class="preview-delta" :class="previewDelta >= 0 ? 'plus' : 'minus'">
              {{ previewDelta >= 0 ? '+' : '' }}{{ previewDelta }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="form-actions">
        <button class="btn" @click="handleClose">取消</button>
        <button class="btn-primary" @click="handleSave">保存规则</button>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.form-container {
  @apply space-y-5;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-slate-700;
}

.form-input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition;
}

.score-input-group {
  @apply flex items-center gap-3;
}

.toggle-btn {
  @apply px-4 py-2 rounded-xl text-sm font-medium border transition;
}

.toggle-btn.positive {
  @apply bg-emerald-50 border-emerald-200 text-emerald-700;
}

.toggle-btn:not(.positive) {
  @apply bg-rose-50 border-rose-200 text-rose-700;
}

.score-input {
  @apply w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg font-semibold;
}

.score-unit {
  @apply text-sm text-slate-500;
}

.preview-text {
  @apply text-xs text-slate-500 mt-1;
}

.category-options,
.scope-options {
  @apply flex flex-wrap gap-2;
}

.category-btn,
.scope-btn {
  @apply px-4 py-2 rounded-xl text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}

.category-btn.active,
.scope-btn.active {
  @apply bg-brand-50 border-brand-300 text-brand-700;
}

.icon-grid {
  @apply grid grid-cols-8 gap-1.5;
}

.icon-btn {
  @apply h-9 w-9 rounded-lg text-lg hover:bg-slate-100 transition flex items-center justify-center;
}

.icon-btn.selected {
  @apply bg-brand-100 ring-2 ring-brand-300;
}

.preview-card {
  @apply p-4 rounded-xl bg-slate-50 border border-slate-200;
}

.preview-label {
  @apply text-xs text-slate-500 mb-2;
}

.preview-rule-card {
  @apply flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200;
}

.preview-icon {
  @apply text-2xl;
}

.preview-content {
  @apply flex-1 flex items-center justify-between;
}

.preview-title {
  @apply text-sm font-medium text-slate-700;
}

.preview-delta {
  @apply text-sm font-semibold px-2 py-1 rounded-lg;
}

.preview-delta.plus {
  @apply bg-emerald-50 text-emerald-700;
}

.preview-delta.minus {
  @apply bg-rose-50 text-rose-700;
}

.form-actions {
  @apply flex justify-end gap-2 pt-4 border-t border-slate-100;
}

.btn {
  @apply rounded-xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}

.btn-primary {
  @apply rounded-xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition;
}
</style>
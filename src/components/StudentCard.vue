<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { petStageSrc } from '@/lib/pets'

const props = defineProps<{ studentId: string; mini?: boolean }>()
const app = useAppStore()

const student = computed(() => {
  const c = app.activeClassroom
  return c?.students?.find((x) => x.id === props.studentId)
})

const pet = computed(() => student.value?.pet)
const selected = computed(() => student.value ? app.ui.selectedStudentIds.includes(student.value.id) : false)
const selectable = computed(() => {
  if (!app.ui.batchMode) return true
  if (app.ui.batchAction === 'score') return !!pet.value
  return !pet.value
})
const progress = computed(() => {
  if (!pet.value) return 0
  const need = app.expNeed(pet.value.level)
  return need <= 0 ? 0 : Math.min(100, Math.round((pet.value.exp / need) * 100))
})

const fx = computed(() => {
  if (!student.value) return null
  const v = app.ui.scoreFx
  if (!v) return null
  if (v.studentId !== student.value.id) return null
  // 超过 1.2s 认为过期（兜底）
  if (Date.now() - v.ts > 1200) return null
  return v.kind
})

// 滑动相关
const cardRef = ref<HTMLElement | null>(null)
const startX = ref(0)
const currentX = ref(0)
const isSwiping = ref(false)
const translateX = ref(0)

function onTouchStart(e: TouchEvent) {
  if (app.ui.batchMode) return
  const touch = e.touches[0]
  startX.value = touch.clientX
  currentX.value = startX.value
  isSwiping.value = true
  translateX.value = 0
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value || app.ui.batchMode) return
  currentX.value = e.touches[0].clientX
  const delta = currentX.value - startX.value
  // 只允许向左滑动（显示操作菜单）
  if (delta < 0) {
    e.preventDefault()
    translateX.value = Math.max(-80, delta) // 最大滑动 80px
  }
}

function onTouchEnd() {
  if (!isSwiping.value || app.ui.batchMode || !student.value) return
  isSwiping.value = false

  if (translateX.value < -40) {
    // 触发快捷操作
    if (pet.value) {
      app.openModal('score', student.value.id)
    } else {
      app.openModal('adopt', student.value.id)
    }
  }
  translateX.value = 0
}

function onCardClick() {
  if (!student.value) return
  if (app.ui.batchMode) {
    if (selectable.value) app.toggleSelectStudent(student.value.id)
    return
  }
  if (pet.value) app.openModal('score', student.value.id)
  else app.openModal('adopt', student.value.id)
}
</script>

<template>
  <!-- 迷你模式 -->
  <div
    v-if="student && mini"
    class="rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden relative cursor-pointer hover:border-brand-200 transition"
    :class="{ 'border-brand-300 ring-2 ring-brand-200': app.ui.batchMode && selected }"
    @click="onCardClick"
  >
    <button
      v-if="app.ui.batchMode"
      class="check-mini"
      :class="{ on: selected }"
      :disabled="!selectable"
      @click.stop="selectable ? app.toggleSelectStudent(student.id) : undefined"
    >
      <span v-if="selected">✓</span>
    </button>

    <div class="p-2">
      <div class="flex items-center justify-between gap-1">
        <div class="truncate text-sm font-medium">{{ student.name }}</div>
        <div v-if="pet" class="text-xs text-brand-600">Lv.{{ pet.level }}</div>
      </div>
      <div class="text-xs text-slate-500 mt-1">
        积分: {{ student.points }}
        <span v-if="student.badges"> | 🏅{{ student.badges }}</span>
      </div>
    </div>
  </div>

  <!-- 大图模式 -->
  <div
    v-else-if="student"
    ref="cardRef"
    class="rounded-3xl bg-white border shadow-soft overflow-hidden relative touch-pan-y"
    :class="
      app.ui.batchMode
        ? selectable
          ? selected
            ? 'border-brand-300 ring-2 ring-brand-200'
            : 'border-slate-100'
          : 'border-slate-100 opacity-50'
        : 'border-slate-100'
    "
    @click="onCardClick"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    :style="{ transform: translateX !== 0 ? `translateX(${translateX}px)` : undefined, transition: isSwiping ? 'none' : 'transform 0.2s' }"
  >
    <!-- 滑动操作提示（仅在移动端非批量模式下显示） -->
    <div v-if="!app.ui.batchMode" class="swipe-actions">
      <div class="swipe-action-bg"></div>
      <div class="swipe-action-icon">
        <span>{{ pet ? '📝' : '🥚' }}</span>
        <span class="swipe-hint">{{ pet ? '评分' : '领养' }}</span>
      </div>
    </div>
    <!-- 外层左上：更换宠物（仅非批量模式且已领养） -->
    <button
      v-if="pet && !app.ui.batchMode"
      class="swap-btn swap-outer"
      title="更换宠物"
      @click.stop="app.openModal('adopt', student.id)"
    >
      ⟳
    </button>

    <button
      v-if="app.ui.batchMode"
      class="check"
      :class="{ on: selected }"
      :disabled="!selectable"
      @click.stop="selectable ? app.toggleSelectStudent(student.id) : undefined"
      aria-label="选择学生"
    >
      <span v-if="selected">✓</span>
    </button>

    <div class="h-28 sm:h-36 bg-gradient-to-br from-brand-50 to-white grid place-items-center relative">
      <div v-if="!pet" class="text-5xl sm:text-6xl">🥚</div>
      <div v-else class="pet-wrap">
        <img :src="petStageSrc(pet.petId, pet.level)" class="pet-img" :class="fx ? `fx-${fx}` : ''" :alt="pet.name" />

        <div v-if="fx === 'plus'" class="fx-layer">
          <span class="p p1">💗</span>
          <span class="p p2">💖</span>
          <span class="p p3">💛</span>
          <span class="p p4">💚</span>
          <span class="p p5">💙</span>
          <span class="p p6">💜</span>
        </div>
        <div v-else-if="fx === 'minus'" class="fx-layer fx-layer-minus">
          <span class="broken">💔</span>
        </div>

        <!-- 右上：等级 -->
        <div class="lv-badge">Lv. {{ pet.level }}</div>
      </div>
    </div>

    <div class="p-3 sm:p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2 min-w-0">
          <div class="text-base sm:text-lg font-semibold truncate">{{ student.name }}</div>
          <span v-if="student.number" class="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5 flex-shrink-0">
            {{ student.number }}
          </span>
        </div>
        <span class="text-xs text-slate-500 flex-shrink-0">积分：{{ student.points }}</span>
      </div>

      <div v-if="!pet" class="mt-3 sm:mt-4">
        <button class="btn-primary w-full text-sm" @click.stop="app.openModal('adopt', student.id)">领养宠物</button>
      </div>

      <div v-else class="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs sm:text-sm font-medium text-slate-700 truncate">{{ pet.name }}</div>
          <span class="chip">徽章 {{ student.badges }}</span>
        </div>

        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>成长值</span>
            <span class="flex-shrink-0 ml-2">{{ pet.exp }} / {{ app.expNeed(pet.level) }}</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-brand-400" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <div class="text-xs text-slate-400 text-center select-none">点击卡片加分/扣分</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.check {
  @apply absolute left-3 top-3 h-7 w-7 rounded-full border border-slate-200 bg-white/80 grid place-items-center text-sm text-white;
}
.check:disabled {
  @apply opacity-40 cursor-not-allowed;
}
.check.on {
  @apply bg-brand-500 border-brand-500;
}
.pet-wrap {
  @apply h-28 w-28 grid place-items-center relative;
}
.pet-img {
  @apply h-28 w-28 object-contain drop-shadow transition-transform duration-300;
  animation: floaty 3.6s ease-in-out infinite;
}
.pet-wrap:hover .pet-img {
  @apply -translate-y-1 scale-[1.03];
}
@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
.swap-btn {
  @apply absolute left-1 top-1 z-[1] h-8 w-8 rounded-2xl border border-slate-200 bg-white/80 hover:bg-white transition grid place-items-center text-slate-600;
}
.swap-btn.swap-outer {
  @apply left-3 top-3;
}
.lv-badge {
  @apply absolute right-1 top-1 z-[1] rounded-full bg-brand-500 text-white text-xs font-semibold px-2 py-1 shadow-soft;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn-primary {
  @apply rounded-2xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.chip {
  @apply text-xs rounded-full bg-brand-100 text-brand-700 px-2 py-1;
}
.check-mini {
  @apply absolute right-1 top-1 h-5 w-5 rounded-full border border-slate-200 bg-white grid place-items-center text-xs text-white;
}
.check-mini:disabled {
  @apply opacity-40 cursor-not-allowed;
}
.check-mini.on {
  @apply bg-brand-500 border-brand-500;
}

/* 滑动操作样式 */
.swipe-actions {
  @apply absolute inset-0 rounded-3xl overflow-hidden;
  pointer-events: none;
  z-index: 0;
}
.swipe-action-bg {
  @apply absolute inset-y-0 right-0 w-full bg-brand-500 opacity-0;
  transition: opacity 200ms;
}
.swipe-action-icon {
  @apply absolute inset-y-0 right-0 flex items-center justify-center text-white opacity-0;
  width: 80px;
  transition: opacity 200ms;
}
.swipe-hint {
  @apply text-xs font-medium;
}

/* 移动端优化：触摸反馈 */
@media (max-width: 640px) {
  .touch-pan-y {
    touch-action: pan-y;
  }
}

.pet-img.fx-plus {
  animation: floaty 3.6s ease-in-out infinite, bouncePlus 520ms cubic-bezier(.2,.9,.2,1);
}
.pet-img.fx-minus {
  animation: floaty 3.6s ease-in-out infinite, shakeMinus 520ms ease-in-out;
  filter: grayscale(0.35);
}

.fx-layer {
  @apply absolute inset-0 pointer-events-none;
}
.fx-layer .p {
  @apply absolute text-xl;
  animation: popUp 720ms ease-out forwards;
  opacity: 0;
}
.fx-layer .p1 { left: 10%; top: 65%; animation-delay: 0ms; }
.fx-layer .p2 { left: 22%; top: 40%; animation-delay: 40ms; }
.fx-layer .p3 { left: 42%; top: 60%; animation-delay: 80ms; }
.fx-layer .p4 { left: 62%; top: 45%; animation-delay: 60ms; }
.fx-layer .p5 { left: 76%; top: 68%; animation-delay: 20ms; }
.fx-layer .p6 { left: 55%; top: 30%; animation-delay: 110ms; }

.fx-layer-minus {
  @apply grid place-items-center;
}
.fx-layer-minus .broken {
  @apply text-3xl text-slate-400 drop-shadow;
  animation: crack 620ms ease-out forwards;
  opacity: 0;
}

@keyframes bouncePlus {
  0% { transform: translateY(0) scale(1); }
  35% { transform: translateY(-10px) scale(1.04); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes shakeMinus {
  0% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-6px) rotate(-2deg); }
  35% { transform: translateX(6px) rotate(2deg); }
  55% { transform: translateX(-4px) rotate(-1deg); }
  75% { transform: translateX(4px) rotate(1deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
@keyframes popUp {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  25% { opacity: 1; }
  100% { transform: translateY(-28px) scale(1.05); opacity: 0; }
}
@keyframes crack {
  0% { transform: scale(0.85); opacity: 0; }
  25% { opacity: 1; }
  100% { transform: scale(1.1); opacity: 0; }
}
</style>


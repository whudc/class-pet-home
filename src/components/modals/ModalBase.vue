<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ close: [] }>()

let prevBodyOverflow = ''
let prevHtmlOverflow = ''

const modalRef = ref<HTMLElement | null>(null)
const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)
const translateY = ref(0)

onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
})

function onTouchStart(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('.no-swipe-close')) return
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
  isDragging.value = true
  translateY.value = 0
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  currentY.value = e.touches[0].clientY
  const delta = currentY.value - startY.value
  if (delta > 0) {
    translateY.value = delta
  }
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  if (translateY.value > 100) {
    emit('close')
  } else {
    translateY.value = 0
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 overscroll-contain safe-top safe-bottom">
    <div class="absolute inset-0 bg-black/30 z-0" @click="emit('close')"></div>
    <div
      class="absolute inset-0 p-0 sm:p-4 flex items-stretch justify-center z-10"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div
        ref="modalRef"
        class="w-full sm:max-w-4xl sm:my-4 rounded-2xl sm:rounded-3xl bg-white shadow-soft border border-slate-100 overflow-hidden flex flex-col max-h-full sm:max-h-[calc(100vh-2rem)]"
        :style="{ transform: translateY > 0 ? `translateY(${translateY}px)` : undefined, transition: isDragging ? 'none' : 'transform 0.2s' }"
      >
        <div class="px-3 py-2 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="font-semibold text-slate-900 text-sm sm:text-base">
            <slot name="title" />
          </div>
          <button class="text-slate-400 hover:text-slate-700 p-2 touch-manipulation" @click="emit('close')">✕</button>
        </div>
        <!-- 移动端下滑提示条 -->
        <div class="sm:hidden flex justify-center pt-2 pb-1">
          <div class="w-10 h-1 rounded-full bg-slate-200"></div>
        </div>
        <div class="p-3 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain no-swipe-close">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:slotted(.chip-en) {
  @apply ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] tracking-wide border border-slate-200 bg-slate-50 text-slate-500;
}
</style>

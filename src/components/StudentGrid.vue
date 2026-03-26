<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import StudentCard from '@/components/StudentCard.vue'
import PullToRefresh from '@/components/PullToRefresh.vue'

const app = useAppStore()
const students = computed(() => app.filteredStudents)

// 下拉刷新状态
const isPulling = ref(false)
const isRefreshing = ref(false)
const pullDistance = ref(0)
const pullStartY = ref(0)

function onTouchStart(e: TouchEvent) {
  const scrollContainer = document.querySelector('[data-scroll-container]') || window
  const scrollTop = (scrollContainer as Window).scrollY || (scrollContainer as HTMLElement).scrollTop || 0

  if (scrollTop === 0 && !isRefreshing.value) {
    pullStartY.value = e.touches[0].clientY
    isPulling.value = true
    pullDistance.value = 0
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isPulling.value || isRefreshing.value) return

  const currentY = e.touches[0].clientY
  const delta = currentY - pullStartY.value

  if (delta > 0) {
    e.preventDefault()
    // 添加阻力效果
    const resistance = Math.log(1 + delta / 10) * 10
    pullDistance.value = Math.min(resistance, 120)
  }
}

function onTouchEnd() {
  if (!isPulling.value || isRefreshing.value) {
    isPulling.value = false
    return
  }

  isPulling.value = false

  if (pullDistance.value > 60) {
    // 触发刷新
    isRefreshing.value = true
    pullDistance.value = 80

    // 模拟刷新（实际上只是重置 UI 状态）
    setTimeout(() => {
      isRefreshing.value = false
      pullDistance.value = 0
    }, 500)
  } else {
    pullDistance.value = 0
  }
}

// 监听刷新完成，重置状态
watch(() => app.data.records.length, () => {
  if (isRefreshing.value) {
    isRefreshing.value = false
    pullDistance.value = 0
  }
})
</script>

<template>
  <div
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <PullToRefresh :pulling="isPulling" :refreshing="isRefreshing" :pull-distance="pullDistance" />

    <div
      v-if="students.length === 0"
      class="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500"
    >
      没有匹配的学生。你可以在"设置与帮助 → 数据管理"里导入示例数据。
    </div>

    <div v-else class="grid gap-3 xs:gap-4" :class="app.ui.cardViewMode === 'large' ? 'grid-cols-2 xs:grid-cols-2 lg:grid-cols-5' : 'grid-cols-3 xs:grid-cols-4 lg:grid-cols-10'">
      <StudentCard v-for="s in students" :key="s.id" :student-id="s.id" :mini="app.ui.cardViewMode === 'mini'" />
    </div>
  </div>
</template>

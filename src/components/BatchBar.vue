<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const count = computed(() => app.ui.selectedStudentIds.length)


function scoreBatch() {
  app.setBatchAction('score')
  if (app.ui.selectedStudentIds.length === 0) return
  app.openModalForStudents('score', app.ui.selectedStudentIds)
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 safe-bottom pb-2">
    <div class="mx-auto max-w-6xl px-3 sm:px-4">
      <div class="bar">
        <div class="left">
          <div class="text-xs sm:text-sm text-slate-600">已选 <span class="font-semibold text-orange-700">{{ count }}</span> 位</div>
          <button class="link hidden xs:block" @click="app.selectAllFiltered">全选</button>
          <span class="sep hidden xs:inline">|</span>
          <button class="link hidden xs:block" @click="app.clearSelection">清空</button>
          <!-- 移动端简化按钮 -->
          <button class="link xs:hidden" @click="app.selectAllFiltered">全选</button>
          <button class="link xs:hidden" @click="app.clearSelection">清空</button>
        </div>

        <div class="right">
          <button class="btn hidden sm:block" @click="app.exitBatchMode">取消</button>
          <button class="btn sm:hidden" @click="app.exitBatchMode">✕</button>
          <button
            class="btn-primary"
            :class="{ active: app.ui.batchAction === 'score' }"
            :disabled="count === 0"
            @click="scoreBatch"
          >
            <span class="hidden sm:inline">批量评价</span>
            <span class="sm:hidden">评价</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  @apply rounded-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-lg px-3 sm:px-4 py-3 sm:py-3 flex items-center justify-between gap-2 sm:gap-4;
}
.left {
  @apply flex items-center gap-2 sm:gap-3;
}
.right {
  @apply flex items-center gap-2;
}
.link {
  @apply text-xs sm:text-sm text-orange-700 hover:text-orange-800;
}
.sep {
  @apply text-slate-300;
}
.btn {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn.active {
  @apply border-orange-300 bg-orange-50 text-orange-700;
}
.btn-primary {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm bg-orange-500 text-white hover:bg-orange-600 transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary.active {
  @apply ring-2 ring-orange-200;
}
</style>


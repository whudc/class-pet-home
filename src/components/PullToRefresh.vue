<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  pulling: boolean
  refreshing: boolean
  pullDistance?: number
}>(), {
  pullDistance: 0
})

const visible = computed(() => props.pulling || props.refreshing)
const progress = computed(() => Math.min(100, (props.pullDistance / 80) * 100))
</script>

<template>
  <div
    v-show="visible"
    class="fixed left-0 right-0 top-0 flex flex-col items-center justify-center pointer-events-none z-50 overflow-hidden"
    :style="{ height: pulling ? `${Math.max(pullDistance, 40)}px` : '40px' }"
  >
    <div class="flex items-center gap-2 text-slate-500 text-xs">
      <template v-if="refreshing">
        <span class="animate-spin text-lg">⟳</span>
        <span>加载中...</span>
      </template>
      <template v-else>
        <span :style="{ transform: 'rotate(' + (progress * 3.6) + 'deg)' }" class="inline-block transition-transform text-lg">⟳</span>
        <span v-if="pullDistance > 60">释放刷新</span>
        <span v-else>下拉刷新</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppStore, type SortMode } from '@/stores/app'

const app = useAppStore()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

type Option = { key: SortMode; label: string; icon: string }

const options: Option[] = [
  { key: 'name', label: '按姓名排序', icon: '👤' },
  { key: 'number', label: '按学号排序', icon: '#️⃣' },
  { key: 'badges', label: '按徽章排序', icon: '🏅' },
  { key: 'growth', label: '按养成进度', icon: '📈' },
]

const current = computed(() => options.find((o) => o.key === app.ui.sortMode) ?? options[0])

function choose(key: SortMode) {
  app.ui.sortMode = key
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const el = rootEl.value
  if (!el) return
  if (el.contains(e.target as Node)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="rootEl" class="relative">
    <button class="btn" @click="open = !open">
      <span class="mr-2">{{ current.icon }}</span>
      <span class="text-sm font-medium">{{ current.label }}</span>
      <span class="ml-2 text-slate-400">▾</span>
    </button>

    <!-- 使用 Teleport 传送到 body，避免被父容器层叠上下文影响 -->
    <Teleport to="body">
      <div
        v-if="open"
        class="sort-menu-overlay"
        @click="open = false"
      >
        <div class="sort-menu-dropdown" @click.stop>
          <button
            v-for="o in options"
            :key="o.key"
            class="item"
            :class="{ active: app.ui.sortMode === o.key }"
            @click="choose(o.key)"
          >
            <span class="w-6 grid place-items-center">{{ o.icon }}</span>
            <span class="flex-1 text-left">{{ o.label }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-xl px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center gap-2 shadow-sm;
}
.item {
  @apply w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-50 transition;
}
.item.active {
  @apply bg-orange-50 text-orange-700;
}

/* 遮罩层 - 使用 Teleport 传送到 body，确保最高层级 */
.sort-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下拉菜单样式 */
.sort-menu-dropdown {
  position: relative;
  min-width: 200px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  padding: 8px;
}
</style>


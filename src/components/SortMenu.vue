<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { useAppStore, type SortMode } from '@/stores/app'

const app = useAppStore()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)
const dropdownPos = ref({ top: '0px', left: '0px' })

type Option = { key: SortMode; label: string }

const options: Option[] = [
  { key: 'name', label: '姓名' },
  { key: 'number', label: '学号' },
  { key: 'badges', label: '徽章' },
  { key: 'growth', label: '成长' },
]

const current = computed(() => options.find((o) => o.key === app.ui.sortMode) ?? options[0])

function toggleDropdown() {
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      if (rootEl.value) {
        const rect = rootEl.value.getBoundingClientRect()
        dropdownPos.value = {
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`
        }
      }
    })
  }
}

function choose(key: SortMode) {
  app.setSortMode(key)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const root = rootEl.value
  const dropdown = dropdownEl.value
  if (root && root.contains(e.target as Node)) return
  if (dropdown && dropdown.contains(e.target as Node)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="rootEl" class="relative">
    <button class="btn" @click="toggleDropdown">
      <span class="text-sm font-medium">{{ current.label }}</span>
      <span class="text-slate-400">▾</span>
    </button>

    <div
      v-if="open"
      ref="dropdownEl"
      class="dropdown"
      :style="{ top: dropdownPos.top, left: dropdownPos.left }"
    >
      <button
        v-for="o in options"
        :key="o.key"
        class="item"
        :class="{ active: app.ui.sortMode === o.key }"
        @click="choose(o.key)"
      >
        <span class="flex-1 text-left">{{ o.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-xl px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center gap-1 shadow-sm;
}
.dropdown {
  position: fixed;
  @apply w-32 rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden;
  z-index: 9999;
}
.item {
  @apply w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition cursor-pointer;
}
.item.active {
  @apply bg-orange-50 text-orange-700;
}
</style>

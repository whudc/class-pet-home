<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'

import StudentGrid from '@/components/StudentGrid.vue'
import ModalAdoptPet from '@/components/modals/ModalAdoptPet.vue'
import ModalScore from '@/components/modals/ModalScore.vue'
import ModalSettings from '@/components/modals/ModalSettings.vue'
import ModalLeaderboard from '@/components/modals/ModalLeaderboard.vue'
import ModalRecords from '@/components/modals/ModalRecords.vue'
import SortMenu from '@/components/SortMenu.vue'
import ModalClassManager from '@/components/modals/ModalClassManager.vue'
import ModalShop from '@/components/modals/ModalShop.vue'
import BatchBar from '@/components/BatchBar.vue'
import LevelUpOverlay from '@/components/LevelUpOverlay.vue'

const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')

function undoLatest() {
  const res = app.undoLatestScoreRecord()
  if (!res.ok) window.alert(res.reason)
  else window.alert('已撤回最近一条评价')
}

onMounted(async () => {
  // 自动备份循环只初始化一次；开关控制是否真正执行写入
  await app.startAutoBackupLoop()
})

watch(
  () => app.ui.autoBackupEnabled,
  async (v) => {
    // 关闭时不销毁循环（避免多处组件重复启动），但允许你需要“彻底停止”时调用 stopAutoBackupLoop
    if (v) {
      await app.refreshAutoBackupTarget()
      if (app.ui.autoBackupHasTarget) await app.runAutoBackupOnce()
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-slate-50 safe-top">
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 safe-top">
      <div class="mx-auto max-w-6xl px-3 sm:px-4 pt-2 sm:pt-3 pb-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="h-9 w-9 sm:h-12 sm:w-12 rounded-2xl bg-brand-100 grid place-items-center shadow-soft flex-shrink-0">
            <span class="text-xl sm:text-2xl">🐾</span>
          </div>
          <div class="leading-tight min-w-0">
            <div class="text-xs text-slate-500 hidden xs:block">班级宠物园</div>
            <button
              class="font-semibold text-slate-900 flex items-center gap-1 sm:gap-2 hover:text-brand-700 transition truncate"
              @click="app.openModal('classManager')"
            >
              <span class="truncate">{{ activeName }}</span>
              <span class="text-slate-400 text-xs sm:text-base">▾</span>
            </button>
          </div>
        </div>

        <button class="btn-ghost flex-shrink-0 sm:block hidden" @click="app.openModal('settings')">
          <span class="mr-1 sm:mr-2">⚙️</span>
          <span class="hidden sm:inline">设置与帮助</span>
        </button>
      </div>

      <div class="mx-auto max-w-6xl px-3 sm:px-4 pb-2 sm:pb-3 flex flex-col gap-2">
        <div class="w-full">
          <div class="relative">
            <input
              v-model="app.ui.query"
              class="w-full rounded-2xl border-slate-200 bg-white/80 pl-10 pr-4 py-2.5 text-sm touch-manipulation mobile-input"
              placeholder="搜索学生…"
              type="search"
              inputmode="text"
              enterkeyhint="search"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          </div>
        </div>

        <div class="flex flex-wrap justify-start sm:justify-end gap-1.5 sm:gap-2">
          <SortMenu />
          <button class="btn sm:block hidden" @click="app.openModal('leaderboard')">🏆<span class="hidden xs:inline">排行榜</span></button>
          <button class="btn sm:block hidden" @click="app.openModal('shop')">🛍<span class="hidden xs:inline">小商店</span></button>
          <button class="btn sm:block hidden" @click="app.openModal('records')">🕘<span class="hidden xs:inline">记录</span></button>
          <button class="btn sm:block hidden" @click="undoLatest">↩<span class="hidden xs:inline">撤回</span></button>
          <button class="btn-primary sm:min-w-[100px] sm:block hidden" @click="app.ui.batchMode ? app.exitBatchMode() : app.enterBatchMode()">
            {{ app.ui.batchMode ? '退出批量' : '批量操作' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端底部导航栏 -->
    <nav class="sm:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom border-t border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto max-w-6xl px-2">
        <div class="grid grid-cols-5 gap-1">
          <button class="nav-item touch-feedback" @click="app.openModal('leaderboard')">
            <span class="nav-icon">🏆</span>
            <span class="nav-label">排行</span>
          </button>
          <button class="nav-item touch-feedback" @click="app.openModal('shop')">
            <span class="nav-icon">🛍</span>
            <span class="nav-label">商店</span>
          </button>
          <button class="nav-item nav-action touch-feedback" @click="app.ui.batchMode ? app.exitBatchMode() : app.enterBatchMode()">
            <span class="nav-icon nav-action-icon">{{ app.ui.batchMode ? '✕' : '👥' }}</span>
            <span class="nav-label">{{ app.ui.batchMode ? '退出' : '批量' }}</span>
          </button>
          <button class="nav-item touch-feedback" @click="app.openModal('records')">
            <span class="nav-icon">🕘</span>
            <span class="nav-label">记录</span>
          </button>
          <button class="nav-item touch-feedback" @click="undoLatest">
            <span class="nav-icon">↩</span>
            <span class="nav-label">撤回</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 移动端设置按钮（浮动） -->
    <button class="sm:hidden fixed bottom-20 right-3 z-40 h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg grid place-items-center" @click="app.openModal('settings')">
      <span class="text-xl">⚙️</span>
    </button>

    <main class="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
      <StudentGrid />
    </main>

    <ModalAdoptPet v-if="app.ui.modal === 'adopt'" />
    <ModalScore v-if="app.ui.modal === 'score'" />
    <ModalSettings v-if="app.ui.modal === 'settings'" />
    <ModalLeaderboard v-if="app.ui.modal === 'leaderboard'" />
    <ModalRecords v-if="app.ui.modal === 'records'" />
    <ModalClassManager v-if="app.ui.modal === 'classManager'" />
    <ModalShop v-if="app.ui.modal === 'shop'" />

    <BatchBar v-if="app.ui.batchMode" />

    <LevelUpOverlay v-if="app.ui.levelUp" />
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-200 bg-white/80 hover:bg-white transition;
}
.btn-primary {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.btn-ghost {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white/60 hover:bg-white transition;
}

/* 移动端底部导航栏样式 */
.nav-item {
  @apply flex flex-col items-center justify-center py-2 text-xs text-slate-600 rounded-xl transition active:bg-slate-100;
}
.nav-icon {
  @apply text-xl mb-0.5;
}
.nav-action-icon {
  @apply text-lg;
}
.nav-label {
  @apply text-[10px] leading-none;
}
</style>


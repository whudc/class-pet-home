<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import DesktopHeader from '@/components/DesktopHeader.vue'

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
import ModalAllClass from '@/components/modals/ModalAllClass.vue'
import ModalCustomScore from '@/components/modals/ModalCustomScore.vue'

const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')

function undoLatest() {
  const res = app.undoLatestScoreRecord()
  if (!res.ok) window.alert(res.reason)
  else window.alert('已撤回最近一条评价')
}

function handleShareParent() {
  // TODO: 实现分享家长功能
  window.alert('分享家长功能待实现')
}

function handleAllClass() {
  app.openModal('allClass')
}

function handleCustomScore() {
  app.openModal('customScore')
}

onMounted(async () => {
  await app.startAutoBackupLoop()
})

watch(
  () => app.ui.autoBackupEnabled,
  async (v) => {
    if (v) {
      await app.refreshAutoBackupTarget()
      if (app.ui.autoBackupHasTarget) await app.runAutoBackupOnce()
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-slate-50">
    <!-- 电脑端顶部导航栏 -->
    <DesktopHeader />

    <!-- 移动端顶部栏 -->
    <header class="sm:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 safe-top">
      <div class="mx-auto max-w-7xl px-3 sm:px-4 pt-2 sm:pt-3 pb-2 flex items-center justify-between gap-3">
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

        <button class="btn-ghost flex-shrink-0" @click="app.openModal('settings')">
          <span class="mr-1 sm:mr-2">⚙️</span>
          <span class="hidden sm:inline">设置与帮助</span>
        </button>
      </div>

      <div class="mx-auto max-w-7xl px-3 sm:px-4 pb-2 sm:pb-3 flex flex-col gap-2">
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
          <button class="btn" @click="app.openModal('leaderboard')">🏆<span class="hidden xs:inline">排行榜</span></button>
          <button class="btn" @click="app.openModal('shop')">🛍<span class="hidden xs:inline">小商店</span></button>
          <button class="btn" @click="app.openModal('records')">🕘<span class="hidden xs:inline">记录</span></button>
          <button class="btn" @click="undoLatest">↩<span class="hidden xs:inline">撤回</span></button>
          <button class="btn-primary sm:min-w-[100px]" @click="app.ui.batchMode ? app.exitBatchMode() : app.enterBatchMode()">
            {{ app.ui.batchMode ? '退出批量' : '批量操作' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 电脑端工具栏（仅班级主页显示） -->
    <div v-if="app.activeView === 'classroom'" class="hidden sm:block mx-auto max-w-7xl px-3 sm:px-4 pt-20 pb-4">
      <div class="rounded-2xl bg-white border border-slate-200 p-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div>
              <h2 class="text-base font-semibold text-slate-900">学生卡片</h2>
              <p class="text-xs text-slate-500">管理学生积分与详情</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="app.ui.query"
                class="w-48 rounded-lg border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-sm focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="搜索学生..."
                type="search"
              />
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
            </div>

            <!-- 排序 -->
            <SortMenu />

            <!-- 视图切换 -->
            <button
              class="toolbar-btn"
              :class="{ active: app.ui.cardViewMode === 'mini' }"
              @click="app.toggleCardViewMode()"
            >
              <span>{{ app.ui.cardViewMode === 'large' ? '🗖' : '🗗' }}</span>
              <span>{{ app.ui.cardViewMode === 'large' ? '迷你模式' : '大图模式' }}</span>
            </button>

            <!-- 批量模式 -->
            <button
              class="toolbar-btn"
              :class="{ active: app.ui.batchMode }"
              @click="app.ui.batchMode ? app.exitBatchMode() : app.enterBatchMode()"
            >
              <span>👥</span>
              <span>{{ app.ui.batchMode ? '退出批量' : '批量模式' }}</span>
            </button>

            <!-- 全班操作 -->
            <button class="toolbar-btn" @click="handleAllClass">
              <span>👨‍👩‍👧</span>
              <span>全班操作</span>
            </button>

            <!-- 自定义加分 -->
            <button class="toolbar-btn" @click="handleCustomScore">
              <span>⚙️</span>
              <span>自定义加分</span>
            </button>

            <!-- 分享家长 -->
            <button class="toolbar-btn" @click="handleShareParent">
              <span>📤</span>
              <span>分享家长</span>
            </button>

            <!-- 撤回 -->
            <button class="toolbar-btn" @click="undoLatest">
              <span>↩</span>
              <span>撤回</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 电脑端内容区域 -->
    <main class="hidden sm:block mx-auto max-w-7xl px-3 sm:px-4 pb-8" :style="{ paddingTop: app.activeView === 'classroom' ? 0 : '70px' }">
      <StudentGrid v-if="app.activeView === 'classroom'" :key="'classroom'" />
      <ModalLeaderboard v-else-if="app.activeView === 'leaderboard'" as-view :key="'leaderboard'" />
      <ModalShop v-else-if="app.activeView === 'shop'" as-view :key="'shop'" />
      <ModalRecords v-else-if="app.activeView === 'records'" as-view :key="'records'" />
      <ModalSettings v-else-if="app.activeView === 'settings'" as-view :key="'settings'" />
      <ModalClassManager v-else-if="app.activeView === 'classManager'" as-view :key="'classManager'" />
    </main>

    <!-- 移动端内容区域 -->
    <main class="sm:hidden mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6" :style="{ paddingTop: app.activeView === 'classroom' ? 0 : '70px' }">
      <StudentGrid v-if="app.activeView === 'classroom'" :key="'classroom'" />
      <ModalLeaderboard v-else-if="app.activeView === 'leaderboard'" as-view :key="'leaderboard'" />
      <ModalShop v-else-if="app.activeView === 'shop'" as-view :key="'shop'" />
      <ModalRecords v-else-if="app.activeView === 'records'" as-view :key="'records'" />
      <ModalSettings v-else-if="app.activeView === 'settings'" as-view :key="'settings'" />
      <ModalClassManager v-else-if="app.activeView === 'classManager'" as-view :key="'classManager'" />
    </main>

    <ModalAdoptPet v-if="app.ui.modal === 'adopt'" />
    <ModalScore v-if="app.ui.modal === 'score'" />
    <ModalAllClass v-if="app.ui.modal === 'allClass'" />
    <ModalCustomScore v-if="app.ui.modal === 'customScore'" />

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

/* 工具栏按钮 */
.toolbar-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-sm;
}
.toolbar-btn.active {
  @apply bg-brand-50 border-brand-200 text-brand-600;
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

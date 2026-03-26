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
import ModalAllClass from '@/components/modals/ModalAllClass.vue'
import ModalCustomScore from '@/components/modals/ModalCustomScore.vue'

const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')

// 微信浏览器刷新 - 使用时间戳 + 随机数强制绕过缓存
function forceRefresh() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const href = window.location.href
  const newUrl = `${href.split('?')[0]}?_t=${ts}&_r=${rand}`
  // 使用 location.replace 替换当前历史，避免后退按钮问题
  window.location.replace(newUrl)
}

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

function toggleGroupMode() {
  if (app.ui.batchMode && app.ui.batchAction === 'score') {
    app.exitBatchMode()
  } else {
    app.enterBatchMode()
    app.setBatchAction('score')
  }
}

function toggleBatchMode() {
  if (app.ui.batchMode) {
    app.exitBatchMode()
  } else {
    app.enterBatchMode()
  }
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
    <!-- 移动端顶部栏 -->
    <header class="sm:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
      <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="leading-tight min-w-0">
            <div class="text-sm font-semibold text-slate-700 truncate">班级宠物园</div>
            <button
              class="text-base font-bold text-slate-900 hover:text-orange-600 transition truncate"
              @click="app.openModal('classManager')"
            >
              {{ activeName }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="px-3 py-2 rounded-xl bg-orange-100 text-sm text-orange-600 font-medium" @click="forceRefresh">
            🔄
          </button>
          <button class="px-4 py-2 rounded-xl bg-slate-100 text-sm text-slate-600 font-medium" @click="app.openModal('settings')">
            退出
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
    <main class="sm:hidden mx-auto max-w-7xl px-4 py-4 pb-24">
      <!-- 搜索和排序 -->
      <div v-if="app.activeView === 'classroom'" class="mb-4">
        <!-- 搜索框 -->
        <div class="relative mb-3">
          <input
            v-model="app.ui.query"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm"
            placeholder="搜索学生..."
            type="search"
          />
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
        </div>

        <!-- 排序和功能按钮 -->
        <div class="space-y-2">
          <!-- 第一排：排序 + 视图模式 + 个人/小组 -->
          <div class="flex gap-2">
            <SortMenu />
            <button
              class="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-50"
              @click="app.toggleCardViewMode()"
            >
              {{ app.ui.cardViewMode === 'large' ? '大图模式' : '迷你模式' }}
            </button>
            <button
              class="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-50"
              @click="toggleGroupMode()"
            >
              {{ app.ui.batchMode && app.ui.batchAction === 'score' ? '小组' : '个人' }}
            </button>
          </div>

          <!-- 第二排：分享家长 + 批量模式 + 全班操作 + 自定义加分 -->
          <div class="flex gap-2">
            <button
              class="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-50"
              @click="handleShareParent()"
            >
              分享家长
            </button>
            <button
              class="flex-1 py-2 px-3 rounded-xl shadow-sm active:bg-slate-50 text-sm font-medium"
              :class="app.ui.batchMode ? 'bg-orange-500 text-white border-orange-300' : 'bg-white text-slate-600 border-slate-200'"
              @click="toggleBatchMode()"
            >
              {{ app.ui.batchMode ? '退出批量' : '批量模式' }}
            </button>
            <button
              class="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-50"
              @click="handleAllClass()"
            >
              全班操作
            </button>
            <button
              class="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-50"
              @click="handleCustomScore()"
            >
              自定义加分
            </button>
          </div>
        </div>
      </div>

      <StudentGrid v-if="app.activeView === 'classroom'" :key="'classroom'" />
      <ModalLeaderboard v-else-if="app.activeView === 'leaderboard'" as-view :key="'leaderboard'" />
      <ModalShop v-else-if="app.activeView === 'shop'" as-view :key="'shop'" />
      <ModalRecords v-else-if="app.activeView === 'records'" as-view :key="'records'" />
      <ModalSettings v-else-if="app.activeView === 'settings'" as-view :key="'settings'" />
      <ModalClassManager v-else-if="app.activeView === 'classManager'" as-view :key="'classManager'" />
    </main>

    <!-- 移动端底部导航栏 -->
    <nav class="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-40">
      <div class="flex items-center justify-around py-2">
        <button
          class="flex flex-col items-center justify-center p-2 rounded-xl transition"
          :class="app.activeView === 'classroom' ? 'text-orange-500' : 'text-slate-400'"
          @click="app.setActiveView('classroom')"
        >
          <span class="text-xl">🏠</span>
          <span class="text-xs mt-0.5">首页</span>
        </button>
        <button
          class="flex flex-col items-center justify-center p-2 rounded-xl transition"
          :class="app.activeView === 'leaderboard' ? 'text-orange-500' : 'text-slate-400'"
          @click="app.setActiveView('leaderboard')"
        >
          <span class="text-xl">🏆</span>
          <span class="text-xs mt-0.5">光荣榜</span>
        </button>
        <button
          class="flex flex-col items-center justify-center p-2 rounded-xl transition"
          :class="app.activeView === 'shop' ? 'text-orange-500' : 'text-slate-400'"
          @click="app.setActiveView('shop')"
        >
          <span class="text-xl">🛍</span>
          <span class="text-xs mt-0.5">小卖部</span>
        </button>
        <button
          class="flex flex-col items-center justify-center p-2 rounded-xl transition"
          :class="app.activeView === 'records' ? 'text-orange-500' : 'text-slate-400'"
          @click="app.setActiveView('records')"
        >
          <span class="text-xl">📋</span>
          <span class="text-xs mt-0.5">记录</span>
        </button>
        <button
          class="flex flex-col items-center justify-center p-2 rounded-xl transition"
          :class="app.activeView === 'settings' ? 'text-orange-500' : 'text-slate-400'"
          @click="app.setActiveView('settings')"
        >
          <span class="text-xl">⚙️</span>
          <span class="text-xs mt-0.5">设置</span>
        </button>
      </div>
    </nav>

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
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const auth = useAuthStore()
const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')
const username = computed(() => auth.currentUser?.username ?? '')
const activeView = computed(() => app.activeView)

const menuItems = [
  { key: 'classroom', label: '班级主页' },
  { key: 'leaderboard', label: '光荣榜' },
  { key: 'shop', label: '小卖部' },
  { key: 'records', label: '成长记录' },
  { key: 'settings', label: '老师设置' },
  { key: 'classManager', label: '班级管理' },
]

const rightMenuItems = [
  { key: 'screen', label: '锁屏', icon: '🔒' },
]

function handleMenuClick(key: 'classroom' | 'leaderboard' | 'shop' | 'records' | 'settings' | 'classManager') {
  app.setActiveView(key)
}

function handleRightMenuClick(key: string) {
  switch (key) {
    case 'screen':
      window.alert('锁屏功能待实现')
      break
  }
}

function handleHelp() {
  window.open('https://github.com/whudc/class-pet-home', '_blank')
}

function handleUpdates() {
  window.open('https://github.com/whudc/class-pet-home/releases', '_blank')
}
</script>

<template>
  <header class="desktop-header">
    <div class="header-container">
      <!-- 左侧：Logo + 班级名称 -->
      <div class="header-left">
        <div class="logo-wrapper">
          <div class="logo-icon">🐾</div>
          <span class="logo-text">班级宠物园</span>
        </div>
        <div class="class-selector" @click="app.openModal('classManager')">
          <span class="class-name">{{ activeName }}</span>
          <span class="dropdown-arrow">▾</span>
        </div>
      </div>

      <!-- 中间：导航菜单 -->
      <nav class="header-center">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeView === item.key }"
          @click="handleMenuClick(item.key as any)"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- 右侧：操作区 -->
      <div class="header-right">
        <!-- 右侧菜单按钮 -->
        <div class="right-actions">
          <button
            v-for="item in rightMenuItems"
            :key="item.key"
            class="right-action-btn"
            :title="item.label"
            @click="handleRightMenuClick(item.key)"
          >
            <span>{{ item.icon }}</span>
            <span class="right-action-text">{{ item.label }}</span>
          </button>
        </div>

        <div class="header-actions">
          <button class="action-btn" @click="handleHelp">
            <span class="action-text">帮助中心</span>
          </button>
          <button class="action-btn" @click="handleUpdates">
            <span class="action-text">更新日志</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.desktop-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f3;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #f97316;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  white-space: nowrap;
}

.class-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #fffcf9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #fed7aa;
}

.class-selector:hover {
  background: #ffedd5;
}

.class-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.dropdown-arrow {
  font-size: 11px;
  color: #9ca3af;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: #fff7ed;
  color: #c2410c;
}

.nav-item.active {
  color: #c2410c;
  background: #ffedd5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.right-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-size: 12px;
}

.right-action-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.right-action-text {
  font-size: 11px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-size: 12px;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

@media (max-width: 1200px) {
  .header-container {
    padding: 0 12px;
    gap: 12px;
  }

  .nav-item {
    padding: 5px 10px;
    font-size: 13px;
  }

  .right-action-text {
    display: none;
  }
}
</style>

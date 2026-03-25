<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const auth = useAuthStore()
const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')
const username = computed(() => auth.currentUser?.username ?? '')

const menuItems = [
  { key: 'classroom', label: '班级主页', labelEn: 'Home', icon: '🏠' },
  { key: 'leaderboard', label: '光荣榜', labelEn: 'Leaderboard', icon: '🏆' },
  { key: 'shop', label: '小卖部', labelEn: 'Shop', icon: '🛍' },
  { key: 'records', label: '成长记录', labelEn: 'Records', icon: '📈' },
  { key: 'settings', label: '老师设置', labelEn: 'Settings', icon: '⚙️' },
  { key: 'classManager', label: '班级管理', labelEn: 'Classes', icon: '👥' },
]

function handleMenuClick(key: string) {
  const modalMap: Record<string, string> = {
    classroom: '',
    leaderboard: 'leaderboard',
    shop: 'shop',
    records: 'records',
    settings: 'settings',
    classManager: 'classManager',
  }

  const modalName = modalMap[key]
  if (modalName) {
    app.openModal(modalName as any)
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
      <!-- 左侧：软件介绍 -->
      <div class="header-section header-left">
        <div class="logo-container">
          <div class="logo-icon">🐾</div>
          <div class="logo-text">
            <div class="logo-title">班级宠物园</div>
            <div class="logo-subtitle">Class Pet Home</div>
          </div>
        </div>
      </div>

      <!-- 中间：导航菜单 -->
      <nav class="header-section header-center">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: item.key === 'classroom' }"
          @click="handleMenuClick(item.key)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">
            <span class="nav-text-cn">{{ item.label }}</span>
            <span class="nav-text-en">{{ item.labelEn }}</span>
          </span>
        </button>
      </nav>

      <!-- 右侧：用户信息 -->
      <div class="header-section header-right">
        <div class="class-info">
          <span class="class-label">班级：</span>
          <span class="class-name">{{ activeName }}</span>
        </div>

        <div class="user-info">
          <div class="user-avatar">👤</div>
          <span class="user-name">{{ username }}</span>
        </div>

        <div class="header-actions">
          <button class="action-btn" @click="handleHelp">
            <span>❓</span>
            <span class="action-text">帮助</span>
          </button>
          <button class="action-btn" @click="handleUpdates">
            <span>📝</span>
            <span class="action-text">更新</span>
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
  height: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  gap: 32px;
}

.header-section {
  display: flex;
  align-items: center;
}

.header-left {
  min-width: 200px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 36px;
  line-height: 1;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.logo-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.header-center {
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  margin: 0 4px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.nav-text-cn {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.nav-text-en {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 280px;
  justify-content: flex-end;
}

.class-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.class-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.class-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.user-avatar {
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.action-btn span:first-child {
  font-size: 16px;
}

.action-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

/* 隐藏滚动条 */
@media (max-width: 1200px) {
  .header-container {
    padding: 0 16px;
    gap: 16px;
  }

  .nav-item {
    padding: 6px 10px;
    margin: 0 2px;
  }

  .nav-text-cn {
    font-size: 12px;
  }

  .nav-text-en {
    font-size: 9px;
  }

  .header-right {
    gap: 12px;
    min-width: auto;
  }

  .class-info,
  .user-info {
    padding: 6px 12px;
  }

  .action-btn {
    padding: 4px 8px;
  }
}
</style>

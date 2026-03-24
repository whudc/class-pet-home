<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppShell from '@/components/AppShell.vue'
import Auth from '@/components/Auth.vue'

const auth = useAuthStore()
const app = useAppStore()

const isLoggedIn = computed(() => auth.isAuthenticated)

onMounted(() => {
  auth.initAuth()
})

// 监听登录状态，登录后启用云端同步
watch(
  () => auth.isAuthenticated,
  async (isAuthed) => {
    if (isAuthed) {
      await app.enableCloudSync()
    } else {
      app.disableCloudSync()
    }
  },
  { immediate: true }
)
</script>

<template>
  <Auth v-if="!isLoggedIn" />
  <AppShell v-else />
</template>


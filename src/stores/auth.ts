import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/lib/api'

export interface User {
  id: string
  username: string
  createdAt: number
}

interface AuthState {
  currentUser: User | null
  token: string | null
}

const LS_USER_KEY = 'class-pet-home:user'
const LS_TOKEN_KEY = 'class-pet-home:token'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)

  // 初始化时从 localStorage 恢复会话
  async function initAuth() {
    const savedUser = localStorage.getItem(LS_USER_KEY)
    const savedToken = localStorage.getItem(LS_TOKEN_KEY)
    if (savedUser && savedToken) {
      try {
        currentUser.value = JSON.parse(savedUser)
        token.value = savedToken
        // 验证 token 是否有效
        await authApi.getMe()
      } catch {
        localStorage.removeItem(LS_USER_KEY)
        localStorage.removeItem(LS_TOKEN_KEY)
        currentUser.value = null
        token.value = null
      }
    }
  }

  const isAuthenticated = computed(() => !!currentUser.value && !!token.value)

  async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await authApi.login(username, password)
      currentUser.value = result.user
      token.value = result.token

      localStorage.setItem(LS_USER_KEY, JSON.stringify(currentUser.value))
      localStorage.setItem(LS_TOKEN_KEY, result.token)

      return { ok: true }
    } catch (e: any) {
      console.error('Login error:', e)
      return { ok: false, error: e.message || '登录失败，请稍后重试' }
    }
  }

  async function register(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await authApi.register(username, password)
      currentUser.value = result.user
      token.value = result.token

      localStorage.setItem(LS_USER_KEY, JSON.stringify(currentUser.value))
      localStorage.setItem(LS_TOKEN_KEY, result.token)

      return { ok: true }
    } catch (e: any) {
      console.error('Register error:', e)
      return { ok: false, error: e.message || '注册失败，请稍后重试' }
    }
  }

  function logout() {
    currentUser.value = null
    token.value = null
    localStorage.removeItem(LS_USER_KEY)
    localStorage.removeItem(LS_TOKEN_KEY)
  }

  return {
    currentUser,
    token,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
  }
})

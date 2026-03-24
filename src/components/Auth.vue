<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  if (!username.value.trim()) {
    error.value = '请输入用户名'
    loading.value = false
    return
  }

  if (!password.value) {
    error.value = '请输入密码'
    loading.value = false
    return
  }

  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    loading.value = false
    return
  }

  if (isLogin.value) {
    const result = await auth.login(username.value.trim(), password.value)
    if (!result.ok) {
      error.value = result.error || '登录失败'
    }
  } else {
    const result = await auth.register(username.value.trim(), password.value)
    if (result.ok) {
      // 注册成功后自动登录
      await auth.login(username.value.trim(), password.value)
    } else {
      error.value = result.error || '注册失败'
    }
  }

  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo 区域 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-brand-100 shadow-lg mb-4">
          <span class="text-5xl">🐾</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">班级宠物园</h1>
        <p class="text-slate-500 mt-2">记录成长，收获快乐</p>
      </div>

      <!-- 登录/注册表单 -->
      <div class="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div class="flex mb-6 bg-slate-100 rounded-2xl p-1">
          <button
            class="flex-1 py-2.5 text-sm font-medium rounded-xl transition"
            :class="isLogin ? 'bg-white text-brand-600 shadow' : 'text-slate-500 hover:text-slate-700'"
            @click="isLogin = true"
          >
            登录
          </button>
          <button
            class="flex-1 py-2.5 text-sm font-medium rounded-xl transition"
            :class="!isLogin ? 'bg-white text-brand-600 shadow' : 'text-slate-500 hover:text-slate-700'"
            @click="isLogin = false"
          >
            注册
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
            <input
              v-model="username"
              type="text"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-slate-800"
              placeholder="请输入用户名"
              :disabled="loading"
              autocomplete="username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-slate-800"
              placeholder="请输入密码"
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-slate-800"
              placeholder="请再次输入密码"
              :disabled="loading"
              autocomplete="new-password"
            />
          </div>

          <div v-if="error" class="bg-red-50 text-red-600 text-sm py-2.5 px-4 rounded-xl">
            {{ error }}
          </div>

          <button
            type="submit"
            class="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-brand-600 hover:to-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            {{ loading ? '加载中...' : (isLogin ? '登录' : '注册') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-slate-500">
            {{ isLogin ? '还没有账号？' : '已有账号？' }}
            <button
              class="text-brand-600 font-medium hover:text-brand-700 hover:underline"
              @click="toggleMode"
            >
              {{ isLogin ? '立即注册' : '返回登录' }}
            </button>
          </p>
        </div>
      </div>

      <!-- 底部说明 -->
      <p class="text-center text-xs text-slate-400 mt-6">
        电脑端和手机端数据实时同步
      </p>
    </div>
  </div>
</template>

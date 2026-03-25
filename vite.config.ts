import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon-192.png', 'icon-512.png'],
    manifest: {
      name: '班级宠物园',
      short_name: '宠物园',
      description: '课堂管理轻量级应用 - 宠物养成式学生评价系统',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#f97316',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      categories: ['education', 'productivity'],
      lang: 'zh-CN'
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
    }
  }), cloudflare()],
  base: './',  // 使用相对路径，支持 file:// 协议直接打开
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
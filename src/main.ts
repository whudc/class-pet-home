import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import './assets/tailwind.css'

// 清除旧的 PWA Service Worker 缓存
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name)
    }
  })
}

createApp(App).use(createPinia()).mount('#app')


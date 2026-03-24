import { contextBridge } from 'electron'

// 暴露一些 Electron API 给渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'electron'
})

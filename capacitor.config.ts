import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.example.classpet',
  appName: '班级宠物园',
  webDir: 'dist',
  server: {
    // 生产环境使用本地文件
    androidScheme: 'https'
  }
};

export default config;

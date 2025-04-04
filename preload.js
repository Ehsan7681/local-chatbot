const { contextBridge, ipcRenderer } = require('electron');

// تعریف API برای دسترسی به امکانات الکترون از طریق جاوااسکریپت برنامه
contextBridge.exposeInMainWorld('electronAPI', {
  // در اینجا می‌توانید متدهایی برای ارتباط با پروسس اصلی اضافه کنید
  // مثلا برای دسترسی به فایل‌سیستم یا منوهای سیستمی
  appInfo: {
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform
  }
}); 
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');

// کنترل اینکه آیا برنامه قبلاً در حال اجراست
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // متغیر برای نگهداری پنجره اصلی
  let mainWindow;

  function createWindow() {
    // ایجاد پنجره اصلی
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'icons/icon-512x512.png'),
      autoHideMenuBar: true,
      backgroundColor: '#f5f7fa',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#f5f7fa',
        symbolColor: '#333',
        height: 40
      }
    });

    // بارگذاری فایل HTML
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    // باز کردن DevTools در حالت توسعه
    // mainWindow.webContents.openDevTools();

    // واکنش به بسته شدن پنجره
    mainWindow.on('closed', function () {
      mainWindow = null;
    });
  }

  // ایجاد پنجره بعد از آماده شدن برنامه
  app.whenReady().then(createWindow);

  // بستن برنامه در همه پلتفرم‌ها به جز macOS
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });

  // بازسازی پنجره در macOS
  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });

  // واکنش به اجرای دوباره برنامه
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // اضافه کردن منوی سیستمی برای ویندوز
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath);
  }
} 
const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');

const START_URL = 'https://polypmna.dpdns.org/';
const isDev = !app.isPackaged;

if (!isDev) {
  // Keep user data beside the portable executable instead of writing to AppData.
  app.setPath('userData', path.join(path.dirname(process.execPath), 'POLY PMNA Data'));
}

function isAllowedNavigation(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'polypmna.dpdns.org';
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'POLY PMNA',
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  window.loadURL(START_URL);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    // The website does not need device permissions in the desktop wrapper.
    callback(false);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

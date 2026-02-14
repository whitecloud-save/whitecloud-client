import {app, BrowserWindow, Notification, Tray, Menu, nativeImage, dialog} from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as oFs from 'fs';
import {ipcMain} from 'electron/main';
import {spawn} from 'child_process';
import * as semver from 'semver';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remote = require('@electron/remote/main');

remote.initialize();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

const createWindow = async (): Promise<BrowserWindow> => {

  // const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    width: 975,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      allowRunningInsecureContent: true,
      webSecurity: false,
      devTools: true,
    },
    title: 'Whitecloud',
    show: false,
    // menuBarVisible: false,
  });
  win.menuBarVisible = false;

  remote.enable(win.webContents);
  if (serve) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    let pathIndex = './index.html';

    try {
      await fs.access(path.join(__dirname, '../dist/index.html'), fs.constants.F_OK);
      pathIndex = '../dist/index.html';
    } catch (err) {}

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  win.on('close', (event) => {
    event.preventDefault();
    win?.hide();
  });

  win.once('ready-to-show', () => {
    if (!win)
      return;
    // win.webContents.send('mode', {module: 'main'});

    if (process.argv.indexOf('--openAsHidden') < 0) {
      if (win)
        win.show();
    }
  });

  return win;
};

const quitApp = () => {
  tray?.destroy();
  win?.removeAllListeners('close');
  win?.close();
  win = null;
  app.quit();
}

const createTray = (): void => {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: '退出应用',
      click: () => {
        quitApp();
      },
    },
  ]);

  tray.setToolTip('Whitecloud');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });
};

function findLatestUpdate(): string | null {
  const updatesDir = path.join('data', 'updates');

  if (!oFs.existsSync(updatesDir)) {
    return null;
  }

  const files = oFs.readdirSync(updatesDir);
  const updateFiles: { version: string; path: string }[] = [];

  for (const file of files) {
    const match = file.match(/^update-(.+)\.asar$/);
    if (match) {
      updateFiles.push({
        version: match[1],
        path: path.join(updatesDir, file),
      });
    }
  }

  if (updateFiles.length === 0) {
    return null;
  }

  updateFiles.sort((a, b) => semver.compare(a.version, b.version));
  return updateFiles[updateFiles.length - 1].path;
}

function quitAndInstall(tempAsarPath: string) {
  const updaterExe = path.join(process.resourcesPath, 'updater.exe');
  const targetAsar = path.join(process.resourcesPath, 'app.asar');
  const appExe = app.getPath('exe');
  const pid = process.pid.toString();

  const child = spawn(updaterExe, [
    pid,
    targetAsar,
    tempAsarPath,
    appExe
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });

  child.unref();
  quitApp();
}

try {
  app.on('second-instance', () => {
    if (win) {
      if (!win.isVisible()) {
        win.show();
      }
      win.focus();
    }
  });

  app.on('ready', () => {
    if (!serve) {
      const latestUpdatePath = findLatestUpdate();

      if (latestUpdatePath) {
        quitAndInstall(latestUpdatePath);
        return;
      }
    }

    setTimeout(async () => {
      await createWindow();
      createTray();
    }, 400);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });

  const childWinMap = new Map<number, {uuid: string; childWin: BrowserWindow}>();
  ipcMain.handle('start', (event) => {
    const winId = event.sender.id;
    if (winId === win?.webContents.id)
      return {
        module: 'main',
      };

    const data = childWinMap.get(winId);
    if (data) {
      return {
        module: 'guide',
        gameId: data.uuid,
      };
    }

    return null;
  });

  ipcMain.handle('setTop', (event, value) => {
    const data = childWinMap.get(event.sender.id);
    if (!data)
      return;
    data.childWin.setAlwaysOnTop(value);
    return null;
  });

  ipcMain.handle('closeGameGuideWindow', async (event, id) => {
    const data = childWinMap.get(id);
    if (!data)
      return;
    data.childWin.close();
    return;
  });

  ipcMain.handle('createGameGuideWindow', async (event, {uuid, title}) => {
    const childWin = new BrowserWindow({
      width: 330,
      height: 510,
      title,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        allowRunningInsecureContent: true,
        webSecurity: false,
        devTools: serve,
      },
      show: false,
    });

    const id = childWin.webContents.id;
    childWinMap.set(id, {uuid, childWin});

    childWin.menuBarVisible = false;
    childWin.on('closed', () => {
      childWinMap.delete(id);
    });

    remote.enable(childWin.webContents);
    if (serve) {
      childWin.loadURL('http://localhost:4200/');
      childWin.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.access(path.join(__dirname, '../dist/index.html'), fs.constants.F_OK);
        pathIndex = '../dist/index.html';
      } catch (err) {}

      const url = new URL(path.join('file:', __dirname, pathIndex));
      childWin.loadURL(url.href);
    }

    childWin.on('ready-to-show', () => {
      childWin.show();
    });

    return id;
  });

  ipcMain.handle('show-system-notification', async (event, options: {title: string; message: string; icon?: string}) => {
    try {
      const notification = new Notification({
        title: options.title,
        body: options.message,
        icon: options.icon,
      });
      notification.show();
      return {success: true};
    } catch (error) {
      console.error('Failed to show system notification:', error);
      return {success: false, error: error instanceof Error ? error.message : 'Unknown error'};
    }
  });

  ipcMain.handle('quit-and-install', () => {
    if (!serve) {
      const latestUpdatePath = findLatestUpdate();

      if (latestUpdatePath) {
        quitAndInstall(latestUpdatePath);
        return;
      }
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

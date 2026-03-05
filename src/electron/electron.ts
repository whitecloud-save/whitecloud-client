import {app, BrowserWindow, Notification, Tray, Menu, nativeImage, dialog, utilityProcess, MessageChannelMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as oFs from 'fs';
import {ipcMain} from 'electron/main';
import {spawn} from 'child_process';
import * as semver from 'semver';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import {DialogHandler} from './handler/main-handler/dialog-handler.js';
import {AppHandler} from './handler/main-handler/app-handler.js';
import {WindowHandler} from './handler/main-handler/window-handler.js';
import {ShellHandler} from './handler/main-handler/shell-handler.js';
import {MenuHandler} from './handler/main-handler/menu-handler.js';
import {ElectronMessageListener} from './lib/electron-message-listener.js';
import {MessageRoute} from './lib/message-route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let worker: Electron.UtilityProcess | null = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

export const childWinMap = new Map<number, {uuid: string; childWin: BrowserWindow}>();

const createWindow = async (): Promise<BrowserWindow> => {
  // const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    width: 975,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
      webSecurity: true,
      devTools: serve,
    },
    title: 'Whitecloud',
    show: false,
    // menuBarVisible: false,
  });
  win.menuBarVisible = false;

  // remote.enable(win.webContents);
  if (serve) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    let pathIndex = './index.html';

    try {
      await fs.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
      pathIndex = '../angular/index.html';
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

  win.webContents.on('did-finish-load', () => {
    if (!worker) {
      console.error('Worker process is not initialized');
      return;
    }

    const workerChannel = new MessageChannelMain();

    win!.webContents.postMessage('worker-port-init', null, [workerChannel.port1]);

    worker.postMessage({
      command: 'init-port',
      dbPath: path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'data', 'db.sqlite')
    }, [workerChannel.port2]);

    const mainChannel = new MessageChannelMain();
    win!.webContents.postMessage('main-port-init', null, [mainChannel.port1]);

    const mainListener = new ElectronMessageListener(
      mainChannel.port2,
      MessageRoute.callback({
        dialog: new DialogHandler(),
        app:  new AppHandler(win!.id, 'main', null),
        window: new WindowHandler(),
        shell: new ShellHandler(),
        menu: new MenuHandler(),
      })
    );
    mainListener.startListen();
    mainChannel.port2.start();
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
  const iconPath = path.join(__dirname, '../angular/assets/icon.png');
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

    worker = utilityProcess.fork(path.join(__dirname, 'worker.js'));
    worker.on('exit', (code) => {
      console.log(`Worker 进程已退出，退出码: ${code}`);
    });

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

    // remote.enable(childWin.webContents);
    if (serve) {
      childWin.loadURL('http://localhost:4200/');
      childWin.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
        pathIndex = '../angular/index.html';
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
  console.log(e);
  // Catch Error
  // throw e;
}

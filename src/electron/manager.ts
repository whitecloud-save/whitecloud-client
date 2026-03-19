import {app, BrowserWindow, dialog, Menu, MessageChannelMain, nativeImage, Tray, utilityProcess} from 'electron';
import path from 'path';
import fs from 'fs';
import {ElectronMessageListener} from './lib/electron-message-listener.js';
import {MessageRoute} from './lib/message-route.js';
import {DialogHandler} from './handler/main-handler/dialog-handler.js';
import {AppHandler} from './handler/main-handler/app-handler.js';
import {WindowHandler} from './handler/main-handler/window-handler.js';
import {ShellHandler} from './handler/main-handler/shell-handler.js';
import {MenuHandler} from './handler/main-handler/menu-handler.js';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import {EtwManager} from './etw.js';
import {Connector} from '@sora-soft/framework';
import {ElectronMessageConnector} from './lib/electron-message-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Manager {
  static init() {
    app.on('second-instance', () => {
      if (this.mainWindow_) {
        if (!this.mainWindow_.isVisible()) {
          this.mainWindow_.show();
        }
        this.mainWindow_.focus();
      }
    });
  }

  static getResourcesPath() {
    return app.isPackaged ? process.resourcesPath : app.getAppPath();
  }

  static createWorkerProcess() {
    if (this.worker_)
      return this.worker_;

    const worker = utilityProcess.fork(path.join(__dirname, 'worker.js'));
    worker.on('exit', (code) => {
      if (code) {
        this.handleFatalError('异常', `后台进程发生异常退出，退出码:${code}`);
        console.log(`Worker 进程已退出，退出码: ${code}`);
      }
    });
    return this.worker_ = worker;
  }

  static handleFatalError(title: string, message: string) {
    dialog.showErrorBox(title, message);
    app.quit();
  }

  static focusMain() {
    if (!this.mainWindow_)
      return;

    this.mainWindow_.focus();
  }

  static async createMainWindow(serve: boolean) {
    if (this.mainWindow_)
      return;

    const win = new BrowserWindow({
      width: 975,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, '../preload', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        allowRunningInsecureContent: true,
        webSecurity: false,
        devTools: serve,
      },
      title: 'Whitecloud',
      show: false,
      // menuBarVisible: false,
    });
    win.menuBarVisible = false;
    this.mainWindow_ = win;

    if (serve) {
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.promises.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
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

      if (process.argv.indexOf('--openAsHidden') < 0) {
        if (win)
          win.show();
      }
    });

    win.webContents.on('did-finish-load', () => {
      if (!this.worker_) {
        console.error('Worker process is not initialized');
        return;
      }

      const workerChannel = new MessageChannelMain();
      win!.webContents.postMessage('worker-port-init', null, [workerChannel.port1]);

      console.log(process.execPath);
      this.worker_.postMessage({
        command: 'init-port',
        dbPath: path.join(app.isPackaged ? path.dirname(process.execPath) : app.getAppPath(), 'data', 'db.sqlite')
      }, [workerChannel.port2]);

      const mainChannel = new MessageChannelMain();
      win!.webContents.postMessage('main-port-init', null, [mainChannel.port1]);

      const mainListener = new ElectronMessageListener(
        mainChannel.port2,
        MessageRoute.callback({
          dialog: new DialogHandler(),
          app:  new AppHandler(win!.id, 'main', null),
          window: new WindowHandler(win, serve),
          shell: new ShellHandler(),
          menu: new MenuHandler(),
        })
      );
      mainListener.startListen();
      mainChannel.port2.start();
      this.mainWindowConnector_ = new ElectronMessageConnector(mainChannel.port2);
    });

    return win;
  }

  static async createGameGuideWindow(title: string, gameId: string, serve: boolean) {
    const current = this.gameGuideWindows_.get(gameId);
    if (current) {
      return current.id;
    }

    const win = new BrowserWindow({
      width: 330,
      height: 510,
      title,
      webPreferences: {
        preload: path.join(__dirname, '../preload', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        allowRunningInsecureContent: true,
        webSecurity: false,
        devTools: serve,
      },
    });

    this.gameGuideWindows_.set(gameId, win);
    win.menuBarVisible = false;

    if (serve) {
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.promises.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
        pathIndex = '../angular/index.html';
      } catch (err) {}

      const url = new URL(path.join('file:', __dirname, pathIndex));
      win.loadURL(url.href);
    }

    if (serve) {
      win.loadURL('http://localhost:4200/');
      win.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.promises.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
        pathIndex = '../angular/index.html';
      } catch (err) {}

      const url = new URL(path.join('file:', __dirname, pathIndex));
      win.loadURL(url.href);
    }

    let listener: ElectronMessageListener | undefined;

    win.webContents.on('did-finish-load', () => {
      if (!this.worker_) {
        console.error('Worker process is not initialized');
        return;
      }

      listener?.close();

      const workerChannel = new MessageChannelMain();
      win!.webContents.postMessage('worker-port-init', null, [workerChannel.port1]);

      this.worker_.postMessage({
        command: 'init-port',
        dbPath: path.join(app.isPackaged ? path.dirname(process.execPath) : app.getAppPath(), 'data', 'db.sqlite')
      }, [workerChannel.port2]);

      const mainChannel = new MessageChannelMain();
      listener = new ElectronMessageListener(
        mainChannel.port2,
        MessageRoute.callback({
          dialog: new DialogHandler(),
          app:  new AppHandler(win!.id, 'guide', {gameId}),
          window: new WindowHandler(win, serve),
          shell: new ShellHandler(),
          menu: new MenuHandler(),
        })
      );
      win!.webContents.postMessage('main-port-init', null, [mainChannel.port1]);
      listener.startListen();
      mainChannel.port2.start();
    });

    win.on('closed', () => {
      this.gameGuideWindows_.delete(gameId);
      listener?.close();
    });

    return win.id;
  }

  static async closeGameGuideWindow(gameId: string) {
    const win = this.gameGuideWindows_.get(gameId);
    if (!win)
      return;

    win.close();
  }

  static async createSaveFinderWindow(gamePath: string, exePath: string, serve: boolean) {
    if (this.saveFinderWindow_)
      throw new Error('duplicate window');

    const win = new BrowserWindow({
      width: 450,
      height: 650,
      title: '游戏存档文件夹检测',
      webPreferences: {
        preload: path.join(__dirname, '../preload', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        allowRunningInsecureContent: true,
        webSecurity: false,
        devTools: serve,
      },
    });

    this.saveFinderWindow_ = win;
    win.menuBarVisible = false;

    if (serve) {
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.promises.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
        pathIndex = '../angular/index.html';
      } catch (err) {}

      const url = new URL(path.join('file:', __dirname, pathIndex));
      win.loadURL(url.href);
    }

    if (serve) {
      win.loadURL('http://localhost:4200/');
      win.webContents.openDevTools();
    } else {
      let pathIndex = './index.html';

      try {
        await fs.promises.access(path.join(__dirname, '../angular/index.html'), fs.constants.F_OK);
        pathIndex = '../angular/index.html';
      } catch (err) {}

      const url = new URL(path.join('file:', __dirname, pathIndex));
      win.loadURL(url.href);
    }

    let listener: ElectronMessageListener | undefined;

    win.webContents.on('did-finish-load', () => {
      if (!this.worker_) {
        console.error('Worker process is not initialized');
        return;
      }

      listener?.close();

      const workerChannel = new MessageChannelMain();
      win!.webContents.postMessage('worker-port-init', null, [workerChannel.port1]);

      this.worker_.postMessage({
        command: 'init-port',
        dbPath: path.join(app.isPackaged ? path.dirname(process.execPath) : app.getAppPath(), 'data', 'db.sqlite')
      }, [workerChannel.port2]);

      const mainChannel = new MessageChannelMain();
      listener = new ElectronMessageListener(
        mainChannel.port2,
        MessageRoute.callback({
          dialog: new DialogHandler(),
          app:  new AppHandler(win!.id, 'finder', {gamePath, exePath}),
          window: new WindowHandler(win, serve),
          shell: new ShellHandler(),
          menu: new MenuHandler(),
        })
      );
      win!.webContents.postMessage('main-port-init', null, [mainChannel.port1]);
      listener.startListen();
      mainChannel.port2.start();
    });

    win.on('closed', () => {
      this.saveFinderWindow_ = undefined;
      listener?.close();
      EtwManager.closeMonitor();
    });

    return win.id;
  }

  static async closeSaveFinderWindow() {
    if (!this.saveFinderWindow_)
      return;

    this.saveFinderWindow_.close();
  }

  static createTray() {
    const iconPath = path.join(__dirname, '../angular/assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    this.tray_ = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          if (this.mainWindow_) {
            this.mainWindow_.show();
            this.mainWindow_.focus();
          }
        },
      },
      {
        label: '退出应用',
        click: () => {
          this.quitApp();
        },
      },
    ]);

    this.tray_.setToolTip('Whitecloud');
    this.tray_.setContextMenu(contextMenu);

    this.tray_.on('double-click', () => {
      if (this.mainWindow_) {
        if (this.mainWindow_.isVisible()) {
          this.mainWindow_.hide();
        } else {
          this.mainWindow_.show();
          this.mainWindow_.focus();
        }
      }
    });
  };

  static quitApp() {
    for (const [id, win] of this.gameGuideWindows_.entries()) {
      win.close();
    }

    this.tray_?.destroy();
    this.mainWindow_?.removeAllListeners('close');
    this.mainWindow_?.close();
    this.mainWindow_ = undefined;
    app.quit();
  }

  static updateAndQuit(updateAsarPath: string) {
    const updaterExe = path.join(process.resourcesPath, 'updater.exe');
    const targetAsar = path.join(process.resourcesPath, 'app.asar');
    const appExe = app.getPath('exe');
    const pid = process.pid.toString();

    const child = spawn(updaterExe, [
      pid,
      targetAsar,
      updateAsarPath,
      appExe
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });

    child.unref();
    Manager.quitApp();
  }

  static get mainWindowConnector() {
    return this.mainWindowConnector_;
  }

  private static worker_?: Electron.UtilityProcess;
  private static mainWindow_?: BrowserWindow;
  private static mainWindowConnector_?: Connector;
  private static tray_?: Tray;
  private static gameGuideWindows_: Map<string, BrowserWindow> = new Map();
  private static saveFinderWindow_?: BrowserWindow;
}

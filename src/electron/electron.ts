import {app} from 'electron';
import path from 'path';
import fs from 'fs';
import {ipcMain} from 'electron/main';
import {spawn} from 'child_process';
import * as semver from 'semver';
import {Manager} from './manager.js';

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

function findLatestUpdate(): string | null {
  const updatesDir = path.join('data', 'updates');

  if (!fs.existsSync(updatesDir)) {
    return null;
  }

  const files = fs.readdirSync(updatesDir);
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
  Manager.quitApp();
}

app.on('ready', () => {
  Manager.init();

  if (!serve) {
    const latestUpdatePath = findLatestUpdate();

    if (latestUpdatePath) {
      quitAndInstall(latestUpdatePath);
      return;
    }
  }

  Manager.createWorkerProcess();

  setTimeout(async () => {
    Manager.createMainWindow(serve);
    Manager.createTray();
  }, 400);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  Manager.createMainWindow(serve);
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

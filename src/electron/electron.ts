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
  const updatesDir = path.resolve('data', 'updates');

  if (!fs.existsSync(updatesDir)) {
    return null;
  }

  const files = fs.readdirSync(updatesDir);
  const updateFiles: {version: string; path: string}[] = [];

  for (const file of files) {
    if (path.extname(file) !== '.asar')
      continue;

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

app.on('ready', () => {
  Manager.init();

  if (!serve) {
    const latestUpdatePath = findLatestUpdate();

    if (latestUpdatePath) {
      Manager.updateAndQuit(latestUpdatePath);
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

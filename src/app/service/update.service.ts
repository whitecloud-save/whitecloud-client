import { Injectable } from '@angular/core';
import { ServerService } from './server/server.service';
import { ClientVersion } from './server/api';
import { BehaviorSubject, Observable } from 'rxjs';
import {DialogService} from './dialog.service';
import {app, shell} from '@electron/remote';
import path from 'path';
import fs from 'original-fs';
import crypto from 'crypto';
import http from 'http';
import https from 'https';

export enum UpdateState {
  Idle = 'idle',
  Checking = 'checking',
  Downloading = 'downloading',
  ReadyToInstall = 'ready-to-install',
}

export interface UpdateInfo {
  hasFullUpdate: boolean;
  fullUpdateVersion?: string;
  latestVersion?: ClientVersion;
  pendingVersions: ClientVersion[];
}

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private state_ = new BehaviorSubject<UpdateState>(UpdateState.Idle);
  private downloadProgress_ = new BehaviorSubject<number>(0);
  private updateInfo_ = new BehaviorSubject<UpdateInfo | null>(null);

  get state(): Observable<UpdateState> {
    return this.state_.asObservable();
  }

  get downloadProgress(): Observable<number> {
    return this.downloadProgress_.asObservable();
  }

  get updateInfo(): Observable<UpdateInfo | null> {
    return this.updateInfo_.asObservable();
  }

  get currentState(): UpdateState {
    return this.state_.value;
  }

  constructor(
    private server: ServerService,
    private dialogService: DialogService,
  ) {}

  async onApplicationStartup() {
    const updateInfo = await this.checkForUpdates();

    if (!updateInfo) {
      return;
    }

    if (updateInfo.hasFullUpdate && updateInfo.fullUpdateVersion) {
      this.dialogService.openFullUpdateDialog(updateInfo.fullUpdateVersion);
      return;
    }

    if (updateInfo.latestVersion) {
      this.downloadUpdate(updateInfo.latestVersion);
    }
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    const currentVersion = app.getVersion();

    this.state_.next(UpdateState.Checking);

    try {
      const versions = await this.server.business.fetchClientUpdates({ version: currentVersion });

      if (!versions || versions.length === 0) {
        this.state_.next(UpdateState.Idle);
        return null;
      }

      const fullUpdateVersion = versions.find((v: ClientVersion) => v.isFullUpdate);
      const latestVersion = versions[versions.length - 1];

      const info: UpdateInfo = {
        hasFullUpdate: !!fullUpdateVersion,
        fullUpdateVersion: fullUpdateVersion?.version,
        latestVersion,
        pendingVersions: versions,
      };

      this.updateInfo_.next(info);
      this.state_.next(UpdateState.Idle);

      return info;
    } catch (error) {
      console.error('检查更新失败:', error);
      this.state_.next(UpdateState.Idle);
      return null;
    }
  }

  async downloadUpdate(version: ClientVersion): Promise<boolean> {
    this.state_.next(UpdateState.Downloading);
    this.downloadProgress_.next(0);

    try {
      const updatesDir = path.join('data', 'updates');

      if (!fs.existsSync(updatesDir)) {
        fs.mkdirSync(updatesDir, { recursive: true });
      }

      const targetPath = path.join(updatesDir, `update-${version.version}.asar`);

      if (fs.existsSync(targetPath)) {
        const isValid = await this.verifyFileHash(targetPath, version.asarHash);
        if (isValid) {
          const updateAsarPath = path.join(process.resourcesPath, 'update.asar');
          fs.copyFileSync(targetPath, updateAsarPath);
          this.state_.next(UpdateState.ReadyToInstall);
          return true;
        }
        fs.unlinkSync(targetPath);
      }

      const tempPath = path.join(updatesDir, `update-${version.version}.asar.tmp`);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      await this.downloadFile(version.asarUrl, tempPath, version.asarHash);

      fs.renameSync(tempPath, targetPath);
      this.state_.next(UpdateState.ReadyToInstall);
      return true;
    } catch (error) {
      console.error('下载更新失败:', error);
      this.state_.next(UpdateState.Idle);
      return false;
    }
  }

  private verifyFileHash(filePath: string, expectedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha1');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        const fileHash = hash.digest('hex').substring(0, 10);
        stream.destroy();
        console.log(fileHash, expectedHash);
        resolve(fileHash === expectedHash);
      });

      stream.on('error', (err) => {
        stream.destroy();
        reject(err);
      });
    });
  }

  private downloadFile(url: string, destPath: string, expectedHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      const hash = crypto.createHash('sha1');

      const protocol = url.startsWith('https://') ? https : http;
      const request = protocol.get(url, (response: any) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          response.destroy();
          file.destroy();
          fs.unlinkSync(destPath);
          this.downloadFile(response.headers.location, destPath, expectedHash)
            .then(resolve)
            .catch(reject);
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          hash.update(chunk);
          if (totalSize) {
            const progress = Math.round((downloadedSize / totalSize) * 100);
            this.downloadProgress_.next(progress);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          const fileHash = hash.digest('hex').substring(0, 10);

          if (fileHash !== expectedHash) {
            fs.unlinkSync(destPath);
            reject(new Error(`哈希验证失败: 期望 ${expectedHash}, 实际 ${fileHash}`));
            return;
          }

          resolve();
        });
      });

      request.on('error', (err: Error) => {
        file.destroy();
        if (fs.existsSync(destPath)) {
          try {
            fs.unlinkSync(destPath);
          } catch {
            // ignore
          }
        }
        reject(err);
      });

      file.on('error', (err: Error) => {
        file.destroy();
        if (fs.existsSync(destPath)) {
          try {
            fs.unlinkSync(destPath);
          } catch {
            // ignore
          }
        }
        reject(err);
      });
    });
  }

  openWebsite(): void {
    shell.openExternal('https://whitecloud.xyyaya.com');
  }
}

import {ErrorHandler, Injectable} from '@angular/core';
import {ServerService} from './server/server.service';
import {ClientVersion} from './server/api';
import {BehaviorSubject, Observable} from 'rxjs';
import {DialogService} from './dialog.service';
import {mainAPI} from '../library/api/main-api';
import {workerAPI} from 'app/library/api/worker-api';
import {PathUtil} from 'app/library/path-util';
import {BaseError} from 'app/library/error/BaseError';
import {ErrorString} from 'app/library/error/ErrorString';
import {Logger} from 'app/library/logger';

export type Progress = {
  percent: number;
  transferred: number;
  total?: number;
};

export enum UpdateState {
  Idle = 'idle',
  Checking = 'checking',
  Downloading = 'downloading',
  ReadyToInstall = 'ready-to-install',
  Error = 'error',
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
  private waitingUpdatePath_?: string;
  private error_?: Error;

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

  get errorMessage() {
    if (!this.error_)
      return '';

    if (this.error_ instanceof BaseError) {
      return ErrorString[this.error_.code] as string || this.error_.message;
    }

    if (this.error_ instanceof Error) {
      return this.error_.message;
    }

    return '未知错误';
    // return
  }

  get waitingUpdatePath() {
    return this.waitingUpdatePath_;
  }

  constructor(
    private server: ServerService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandler,
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
    const currentVersion = await mainAPI.app.getVersion();

    this.state_.next(UpdateState.Checking);

    try {
      const versions = await this.server.business.fetchClientUpdates({version: currentVersion});

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
      this.errorHandler.handleError(error);
      this.state_.next(UpdateState.Idle);
      return null;
    }
  }

  async downloadUpdate(version: ClientVersion): Promise<boolean> {
    this.state_.next(UpdateState.Downloading);
    this.downloadProgress_.next(0);

    const updatesDir = PathUtil.join('data', 'updates');
    const targetPath = PathUtil.join(updatesDir, `update-${version.version}.asar`)
    const downloaded = await workerAPI.oss.downloadUpdate({
      savePath: targetPath,
      url: version.asarUrl,
      hash: version.asarHash
    }, (progress: Progress) => {
      this.downloadProgress_.next(parseInt((progress.percent * 100).toFixed(0)));
    }).catch(err => {
      this.state_.next(UpdateState.Error);
      this.error_ = err;
      return false;
    });

    if (downloaded) {
      this.waitingUpdatePath_ = targetPath;
      this.state_.next(UpdateState.ReadyToInstall);
      Logger.addLog('update-downloaded', {version: version.version});
    }

    return !!downloaded;
  }

  openWebsite(): void {
    mainAPI.shell.openExternal('https://whitecloud.xyyaya.com');
  }
}

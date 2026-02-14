import {BehaviorSubject, Subscription} from 'rxjs';
import {LocalGameDB} from '../database/game';
import {CacheImage} from '../library/cache-image';
import {AppDataSource} from '../library/database';
import {GameUtil, UnixTime, Utility} from '../library/utility';
import {BaseError} from '../library/error/BaseError';
import {ErrorCode} from '../library/error/ErrorCode';
import {ProcessEventType, ProcessMonitorService} from '../service/process-monitor.service';
import {shell} from '@electron/remote';
import JSZip from 'jszip';
import {v4} from 'uuid';
import fs from 'fs/promises';
import oFS from 'fs';
import path from 'path';
import {mkdirp} from 'mkdirp';
import {spawn} from 'child_process';
import {Save} from './save';
import {SaveDB} from '../database/save';
import {hostname} from 'os';
import {GameHistoryDB} from '../database/game-history';
import {SettingService} from '../service/setting.service';
import {ipcRenderer} from 'electron';
import {GameService} from '../service/game.service';
import {UserGame} from '../service/server/api';
import {ServerService} from '../service/server/server.service';
import {UserService} from '../service/user.service';
import {OssService} from '../service/oss.service';
import {RemoteSave} from './remote-save';
import fileIcon from 'extract-file-icon';
import {GameActivityService} from '../service/game-activity.service';
import {ErrorHandlingUtil} from '../service/error-handling-util';
import {GameActivityDB, GameActivityType} from '../database/game-activity';
import {GameGuideDB} from '../database/game-guide';
import {SaveTransferService} from '../service/save-transfer.service';

export enum GameState {
  Init = 1,
  Checked = 2,
  Running = 3,
  Saving = 4,
  SaveSizeExceeded = 5,

  Cloud = 80,
  Error = 99,
}

export class Game {
  constructor(
    db: LocalGameDB,
    processMonitorService: ProcessMonitorService,
    settingService: SettingService,
    gameService: GameService,
    serverService: ServerService,
    userService: UserService,
    ossService: OssService,
    gameActivityService: GameActivityService,
    private errorHandlingUtil: ErrorHandlingUtil,
    private saveTransferService: SaveTransferService,
  ) {
    this.db_ = db;
    this.coverImage_ = new CacheImage(db.coverImgUrl, serverService);
    this.state_ = new BehaviorSubject<GameState>(GameState.Init);
    this.activityUpdate$ = new BehaviorSubject<string>(this.id);

    this.processMonitorService_ = processMonitorService;
    this.settingService_ = settingService;
    this.gameService_ = gameService;
    this.serverService_ = serverService;
    this.userService_ = userService;
    this.ossService_ = ossService;
    this.gameActivityService_ = gameActivityService;
    this.saveTransferService_ = saveTransferService;

    this.runningProcess_ = new Set();
    this.saves_ = [];
    this.history_ = [];
    this.gameStartTime_ = 0;
    this.guideWindowId_ = 0;
    this.cloudSaveNum_ = 0;
    this.enableCloudSave_ = true;
    this.currentSave_ = null;
    this.init();
  }

  async loadIcon() {
    if (this.state_.getValue() !== GameState.Error) {
      const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');
      const data = fileIcon(this.exeFilePath, 32);
      await fs.writeFile(targetPath, data as NodeJS.ArrayBufferView);
      this.iconPath_ = targetPath;
    }
  }

  async init() {
    this.updateRunningInfo();
    const saveDBList = await AppDataSource.manager.find(SaveDB, {
      where: {
        gameId: this.id,
      },
      order: {
        createTime: 'desc',
      },
    });

    for (const saveDB of saveDBList) {
      const save = new Save(saveDB, this);
      this.saves_.push(save);
    }

    this.syncSaveList();

    const historyList = await AppDataSource.manager.find(GameHistoryDB, {
      where: {
        gameId: this.id,
      },
    });
    this.history_ = historyList;
    await this.updateCurrentSave();
    await this.checkState();
  }

  // async syncLastSave() {
  //   const lastSave = this.saves_.filter(save => save.available).sort((a, b) => b.createTime - a.createTime)[0];
  //   if (lastSave instanceof RemoteSave) {
  //     const save = await lastSave.download();
  //     this.replaceRemoteSave(lastSave, save);
  //     save.rollback();
  //   }
  // }

  async rollbackRemoteSave(save: RemoteSave | Save) {
    const newSave = await save.download();
    if (!newSave)
      return;
    if (save instanceof RemoteSave) {
      this.replaceRemoteSave(save, newSave);
    }
    newSave.rollback();
  }

  async syncSaveList() {
    if (this.userService_.isOnline()) {
      const list = await this.serverService_.business.fetGameSave({
        gameId: this.id,
      });
      for (const save of list) {
        const localSave = this.saves_.find(s => s.id === save.saveId);
        if (localSave) {
          localSave.syncFromServer(save);
        } else {
          const remoteSave = new RemoteSave(this, save);
          this.addSave(remoteSave);
        }
      }
      // this.syncLastSave();
    }
  }

  removeAllRemoteSave() {
    this.saves_ = this.saves_.filter((save) => save instanceof Save);
    for (const save of this.saves_ as Save[]) {
      save.removeOssPath();
    }
  }

  async updateRunningInfo() {
    if (this.processOb_)
      this.processOb_.unsubscribe();

    this.runningProcess_ = new Set(...this.processMonitorService_.getRunningProcess(this.gamePath));
    const ob = this.processMonitorService_.registerObservable(this.gamePath);
    this.processOb_ = ob.subscribe((event) => {
      switch(event.type) {
        case ProcessEventType.End:
          this.runningProcess_.delete(event.exeFilePath);
          if (!this.runningProcess_.size) {
            this.onGameProcessExit().catch(err => {
              this.onError(err);
              this.errorHandlingUtil.handleAutoError(err, `存档备份失败`);
            });
          }
          break;
        case ProcessEventType.Start:
          if (!this.runningProcess_.size) {
            this.onGameProcessStart();
          }
          this.runningProcess_.add(event.exeFilePath);
          break;
      }

      this.checkState();
    });
  }

  async removeFromLocal() {
    this.processOb_?.unsubscribe();
    await fs.rm(this.backupSavePath, {recursive: true}).catch((err) => {console.log(err)});
    await AppDataSource.manager.delete(SaveDB, {
      gameId: this.id,
    });
    await AppDataSource.manager.delete(GameActivityDB, {
      gameId: this.id,
    });
    await AppDataSource.manager.delete(GameGuideDB, {
      gameId: this.id,
    });
    await AppDataSource.manager.remove(this.history_);
    await AppDataSource.manager.remove(this.db_);
  }

  async onGameProcessStart() {
    this.gameStartTime_ = UnixTime.now();
  }

  async onGameProcessExit() {
    await this.zipSave();
    const endTime = UnixTime.now();
    const historyRepo = AppDataSource.getRepository(GameHistoryDB);
    const historyDB = historyRepo.create({
      id: v4(),
      gameId: this.id,
      host: hostname(),
      startTime: this.gameStartTime_,
      endTime: endTime,
      synced: 0,
      createTime: endTime,
    });
    await AppDataSource.manager.save(historyDB);
    this.history_ = [...this.history_, historyDB];
    this.activityUpdate$.next(this.id);
    this.gameStartTime_ = 0;

    this.syncGameHistoryToServer([{
      id: historyDB.id,
      gameId: historyDB.gameId,
      host: historyDB.host,
      startTime: historyDB.startTime,
      endTime: historyDB.endTime,
    }]).catch((error) => {
      console.error('同步游戏历史记录失败:', error);
      // this.errorHandlingUtil.handleAutoError(error, `游戏历史记录同步失败`);
    });

    if (this.db_.autoOpenGuide) {
      await ipcRenderer.invoke('closeGameGuideWindow', this.guideWindowId_);
    }
  }

  async uploadSave(save: Save) {
    if (this.userService_.isOnline()) {
      this.saveTransferService_.startTransfer('upload', save.id, this.id, save.remark);

      const showNotification = setTimeout(() => {
        this.saveTransferService_.showProgressNotification(this.name, 'upload');
      }, 1000);

      try {
        const content = await fs.readFile(save.filename);
        const file = new File([content as any], v4());
        return await this.ossService_.uploadGameSave(save, file);
      } finally {
        clearTimeout(showNotification);
        this.saveTransferService_.endTransfer();
      }
    }
    return false;
  }

  async openGameGuide() {
    const id = await ipcRenderer.invoke('createGameGuideWindow', {
      uuid: this.id,
      title: `${this.name} 攻略`,
    });
    this.guideWindowId_ = id;
  }

  getLatestCloudSave(): RemoteSave | Save | null {
    const cloudSaves = this.saves_.filter(save => {
      if (save instanceof RemoteSave) {
        return true;
      }
      if (save instanceof Save) {
        return save.onlyRemote;
      }
      return false;
    });

    if (cloudSaves.length === 0) {
      return null;
    }

    const sortedCloudSaves = cloudSaves.sort((a, b) => b.createTime - a.createTime);
    const latestCloudSave = sortedCloudSaves[0];

    if (this.currentSave_ && latestCloudSave.id === this.currentSave_.id) {
      return null;
    }

    return latestCloudSave;
  }

  async startGame() {
    if (this.settingService_.useLE && this.extractSetting.LEProfile) {
      spawn(this.settingService_.LEExePath, ['-runas', this.extractSetting.LEProfile, this.exeFilePath]);
    } else {
      spawn(this.exeFilePath, {
        cwd: path.dirname(this.exeFilePath),
      });
    }

    if (this.db_.autoOpenGuide) {
      this.openGameGuide();
    }
  }

  async openSavePath() {
    return shell.openPath(this.savePath);
  }

  async openGamePath() {
    return shell.openPath(this.gamePath);
  }

  async createSaveZip() {
    const zip = new JSZip();
    const files = await Utility.readdir(this.savePath);
    for (const file of files) {
      const content = await fs.readFile(path.join(this.savePath, file));
      zip.file(file, content as any);
    }
    return zip.generateNodeStream();
  }

  async cleanExpiredLocalSave() {
    if (!this.db_.localSaveNum)
      return;

    if (this.couldDeletedLocalSave.length > this.db_.localSaveNum) {
      const shouldDeleteSaves = this.couldDeletedLocalSave.slice(this.db_.localSaveNum);
      for (const save of shouldDeleteSaves){
        await save.delete();
      }
    }
  }

  deleteSaveRemoteInfo(id: string) {
    const save = this.saves_.find(s => s.id === id);
    if (!save)
      return;

    if (save instanceof RemoteSave) {
      const index = this.saves_.indexOf(save);
      this.saves_.splice(index, 1);
      this.saves_ = this.saves_.slice(0);
    }
    if (save instanceof Save) {
      save.ossPath = null;
    }
  }

  replaceRemoteSave(remoteSave: RemoteSave, localSave: Save) {
    const remoteIdx = this.saves_.indexOf(remoteSave);
    this.saves_.splice(remoteIdx, 1);
    this.addSave(localSave);
  }

  addSave(save: Save | RemoteSave) {
    this.saves_ = [save, ...this.saves_].sort((a, b) => a.createTime - b.createTime);

    if (save instanceof Save) {
      this.cleanExpiredLocalSave();
    }
  }

  getSave(id: string) {
    const save = this.saves_.find(s => s.id === id);
    return save;
  }

  async uploadCover() {
    if (this.coverImgUrl.startsWith('oss')) {
      return;
    }

    const image = this.cachedCoverImage.nativeImage;
    if (!image)
      return;

    const file = new File([image as BlobPart], v4());
    const key = await this.ossService_.uploadGameCover(this.id, file);
    this.coverImgUrl = `oss://${key}`;
  }

  async zipSave(force = false) {
    try {
      if (this.state_.getValue() === GameState.Error)
        return;

      if (!force && await this.checkSaveSizeExceeded()) {
        this.setState(GameState.SaveSizeExceeded);
        return;
      }

      this.setState(GameState.Saving);
      const directoryHash = await Utility.calculateDirectoryHash(this.savePath);
      const currentSave = this.currentSave_;
      if (currentSave && directoryHash === currentSave.directoryHash && !force) {
        return;
      }

      const directorySize = await Utility.calculateDirectorySize(this.savePath);
      const zipStream = await this.createSaveZip();
      const id = v4();
      const saveZipFilePath = path.join(this.backupSavePath, id + '.zip');
      await mkdirp(path.dirname(saveZipFilePath));
      const fsStream = oFS.createWriteStream(saveZipFilePath);
      await new Promise<void>((resolve, reject) => {
        zipStream.pipe(fsStream).on('finish', resolve).on('error', reject);
      });
      const saveStat = await fs.stat(saveZipFilePath);
      const zipHash = await Utility.calculateFileHash(saveZipFilePath);
      const saveRepo = AppDataSource.getRepository(SaveDB);
      const saveDB = saveRepo.create({
        id,
        gameId: this.id,
        createTime: UnixTime.now(),
        updateTime: UnixTime.now(),
        remark: '',
        hostname: hostname(),
        size: saveStat.size,
        started: false,
        directoryHash,
        directorySize,
        zipHash,
      });
      const save = new Save(saveDB, this);
      await save.save(false);

      this.addSave(save);
      this.currentSave_ = save;

      try {
        const uploaded = await this.uploadSave(save);
        if (uploaded) {
          await this.gameActivityService_.saveBackupCloud(this.id);
        } else {
          await this.gameActivityService_.saveBackupLocal(this.id);
        }
      } catch (error) {
        await this.gameActivityService_.saveBackupLocal(this.id);
        await this.gameActivityService_.saveUploadFailed(this.id, (error as Error).message, 1);
      }

      this.activityUpdate$.next(this.id);
    } catch (err) {
      this.onError(err as BaseError);
      await this.gameActivityService_.createActivity(this.id, GameActivityType.SAVE_BACKUP_LOCAL_FAILED, {reason: (err as BaseError).code});
    }
    this.checkState();
  }

  async checkState() {
    try {
      await fs.access(this.savePath, fs.constants.F_OK);
    } catch (err) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_SAVE_PATH_NOT_FOUND));
      return;
    }

    try {
      await fs.access(this.gamePath, fs.constants.F_OK);
    } catch (err) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_PATH_NOT_FOUND));
      return;
    }

    try {
      await fs.access(this.exeFilePath, fs.constants.F_OK);
    } catch (err) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_EXE_NOT_FOUND));
      return;
    }

    try {
      const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');
      await fs.access(targetPath);
      this.iconPath_ = targetPath;
    } catch (err) {
      await this.loadIcon();
    }

    if (this.runningProcess_.size) {
      this.setState(GameState.Running);
      return;
    }

    if (await this.checkSaveSizeExceeded()) {
      this.setState(GameState.SaveSizeExceeded);
      return;
    }

    this.setState(GameState.Checked);
  }

  setState(state: GameState) {
    this.state_.next(state);
  }

  async save(syncToServer = true) {
    this.db_ = await AppDataSource.manager.save(this.db_);
    if (syncToServer) {
      this.syncToServer();
    }
  }

  onError(err: BaseError) {
    this.setState(GameState.Error);
    if (this.processOb_)
      this.processOb_.unsubscribe();
    this.error = err;
  }

  async syncToServer() {
    if (this.userService_.isOnline()) {
      await this.uploadCover();
      await this.serverService_.business.syncGame(this.syncData);
    }
  }

  async syncFromServer(data: Pick<UserGame, 'updateTime' | 'name' | 'exePath' | 'savePath' | 'gameCoverImgUrl' | 'cloudSaveNum' | 'enableCloudSave'>) {
    this.cloudSaveNum_ = data.cloudSaveNum;
    this.enableCloudSave_ = data.enableCloudSave ?? true;
    if (this.updateTime >= data.updateTime)
      return;

    this.name = data.name;
    this.exeFile = data.exePath;
    if (data.savePath) {
      this.savePath = data.savePath;
    }
    if (data.gameCoverImgUrl && data.gameCoverImgUrl !== this.db_.coverImgUrl) {
      this.coverImgUrl = data.gameCoverImgUrl;
    }
    this.db_.updateTime = data.updateTime;
    await this.save(false);
  }

  async syncGameHistoryToServer(histories: Array<{ id: string; gameId: string; host: string; startTime: number; endTime: number }>) {
    if (!this.userService_.isOnline()) {
      return;
    }

    try {
      const result = await this.serverService_.business.syncGameHistory({
        history: histories.map(h => ({
          id: h.id,
          gameId: h.gameId,
          host: h.host,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
      });

      const historyRepo = AppDataSource.getRepository(GameHistoryDB);
      for (const item of result) {
        const existing = this.history_.find(h => h.id === item.id);
        if (!existing) {
          const historyDB = historyRepo.create({
            id: item.id,
            gameId: item.gameId,
            host: item.host,
            startTime: item.startTime,
            endTime: item.endTime,
            synced: 1,
            createTime: item.createTime,
          });
          await AppDataSource.manager.save(historyDB);
          this.history_ = [...this.history_, historyDB];
        } else {
          existing.synced = 1;
          existing.createTime = item.createTime;
          await AppDataSource.manager.save(existing);
        }
      }
    } catch (error) {
      console.error('同步游戏历史记录到服务器失败:', error);
      throw error;
    }
  }

  async fetchGameHistoryFromServer() {
    if (!this.userService_.isOnline()) {
      return;
    }

    try {
      const lastSyncTime = this.db_.lastGameHistorySyncTime || 0;
      const result = await this.serverService_.business.fetchGameHistory({
        gameId: this.id,
        lastSyncTime,
      });

      const historyRepo = AppDataSource.getRepository(GameHistoryDB);
      let maxCreateTime = 0;

      for (const item of result) {
        const existing = this.history_.find(h => h.id === item.id);
        if (!existing) {
          const historyDB = historyRepo.create({
            id: item.id,
            gameId: item.gameId,
            host: item.host,
            startTime: item.startTime,
            endTime: item.endTime,
            synced: 1,
            createTime: item.createTime,
          });
          await AppDataSource.manager.save(historyDB);
          this.history_ = [...this.history_, historyDB];
        } else {
          existing.startTime = item.startTime;
          existing.endTime = item.endTime;
          existing.host = item.host;
          existing.createTime = item.createTime;
          existing.synced = 1;
          await AppDataSource.manager.save(existing);
        }

        if (item.createTime > maxCreateTime) {
          maxCreateTime = item.createTime;
        }
      }

      if (maxCreateTime > 0) {
        this.db_.lastGameHistorySyncTime = maxCreateTime;
        await this.save(false);
      }
    } catch (error) {
      console.error('从服务器获取游戏历史记录失败:', error);
      throw error;
    }
  }

  async syncUnsyncedHistory() {
    if (!this.userService_.isOnline()) {
      return;
    }

    const unsyncedHistories = this.history_.filter(h => h.synced === 0);
    if (unsyncedHistories.length === 0) {
      return;
    }

    try {
      await this.syncGameHistoryToServer(unsyncedHistories.map(h => ({
        id: h.id,
        gameId: h.gameId,
        host: h.host,
        startTime: h.startTime,
        endTime: h.endTime,
      })));
    } catch (error) {
      console.error('同步未同步的游戏历史记录失败:', error);
      throw error;
    }
  }

  get syncData() {
    return {
      gameId: this.id,
      name: this.name,
      gameCoverImgUrl: this.coverImgUrl,
      savePath: this.serverSavePath,
      exePath: this.db_.exeFile,
      cloudSaveNum: this.cloudSaveNum_ || 5,
      enableCloudSave: this.enableCloudSave_ ?? true,
      order: this.order,
    };
  }

  get serverSavePath() {
    if (this.db_.savePath.startsWith('$'))
      return this.db_.savePath;
    return undefined;
  }

  get savePath() {
    return GameUtil.decodePath(this.db_.savePath, this.db_.gamePath);
  }

  set savePath(value: string) {
    this.db_.savePath = value;
  }

  get backupSavePath() {
    return path.join('.', 'data', 'saves', this.id);
  }

  get gamePath() {
    return this.db_.gamePath;
  }

  set gamePath(value: string) {
    this.db_.gamePath = value;
    this.db_.updateTime = UnixTime.now();
  }

  get name() {
    return this.db_.name;
  }

  set name(value) {
    this.db_.name = value;
    this.db_.updateTime = UnixTime.now();
  }

  get exeFilePath() {
    return path.join(this.db_.gamePath, this.db_.exeFile);
  }

  set exeFile(value: string) {
    this.db_.exeFile = value;
    this.db_.updateTime = UnixTime.now();
  }

  get exeFile() {
    return this.db_.exeFile;
  }

  get id() {
    return this.db_.id;
  }

  get cachedCoverImgUrl() {
    return this.coverImage_.url;
  }

  get coverImgUrl() {
    return this.db_.coverImgUrl;
  }

  set coverImgUrl(value: string) {
    this.db_.coverImgUrl = value;
    this.coverImage_ = new CacheImage(value, this.serverService_);
    this.db_.updateTime = UnixTime.now();
  }

  get autoOpenGuide() {
    return this.db_.autoOpenGuide;
  }

  set autoOpenGuide(value: boolean) {
    this.db_.autoOpenGuide = value;
  }

  get state() {
    return this.state_;
  }

  get createTime() {
    return this.db_.createTime;
  }

  get saves() {
    return this.saves_;
  }

  get lastSave() {
    return this.saves_.sort((a, b) => b.createTime - a.createTime)[0];
  }

  get totalGameTime() {
    return this.history_.reduce((pre, current) => pre + (current.endTime - current.startTime), 0) + (this.gameStartTime_ ? UnixTime.now() - this.gameStartTime_ : 0);
  }

  get lastGameTime() {
    return this.history_.reduce((pre, current) => Math.max(pre, current.endTime), 0);
  }

  get localSaveNum() {
    return this.db_.localSaveNum;
  }

  set localSaveNum(value: number) {
    this.db_.localSaveNum = value;
  }

  get extractSetting() {
    return this.db_.extraSetting;
  }

  get availableLocalSaves(): Save[] {
    return this.saves.filter(save => save instanceof Save && !save.deleted) as Save[];
  }

  get couldDeletedLocalSave(): Save[] {
    return this.saves.filter(save => save instanceof Save && !save.deleted && !save.stared) as Save[];
  }

  get order() {
    return this.db_.order;
  }

  set order(value: number) {
    this.db_.order = value;
    this.db_.updateTime = UnixTime.now();
  }

  get cachedCoverImage() {
    return this.coverImage_;
  }

  get updateTime() {
    return this.db_.updateTime;
  }

  get cloudSaveNum() {
    return this.cloudSaveNum_;
  }

  set cloudSaveNum(value: number) {
    this.cloudSaveNum_ = value;
  }

  get saveBackupLimit(): number {
    return this.db_.saveBackupLimit;
  }

  set saveBackupLimit(value: number) {
    this.db_.saveBackupLimit = value;
  }

  get useCustomSaveBackupLimit(): boolean {
    return this.db_.useCustomSaveBackupLimit;
  }

  set useCustomSaveBackupLimit(value: boolean) {
    this.db_.useCustomSaveBackupLimit = value;
  }

  get enableCloudSave(): boolean {
    return this.enableCloudSave_;
  }

  set enableCloudSave(value: boolean) {
    this.enableCloudSave_ = value;
  }

  getEffectiveSaveBackupLimit(): number {
    if (this.db_.useCustomSaveBackupLimit) {
      return this.db_.saveBackupLimit * 1024 * 1024;
    }
    return this.settingService_.globalSaveBackupLimit * 1024 * 1024;
  }

  async checkSaveSizeExceeded(): Promise<boolean> {
    try {
      const directorySize = await Utility.calculateDirectorySize(this.savePath);
      const limit = this.getEffectiveSaveBackupLimit();
      return directorySize > limit;
    } catch {
      return false;
    }
  }

  get serverService() {
    return this.serverService_;
  }

  get userService() {
    return this.userService_;
  }

  addHistory(history: GameHistoryDB) {
    this.history_ = [...this.history_, history];
    this.activityUpdate$.next(this.id);
  }

  async updateLastGameHistorySyncTime(time: number) {
    this.db_.lastGameHistorySyncTime = time;
    await this.save(false);
  }

  get iconPath() {
    return this.iconPath_;
  }

  getCurrentSave(): Save | null {
    return this.currentSave_;
  }

  private async updateCurrentSave(): Promise<void> {
    try {
      const currentDirHash = await Utility.calculateDirectoryHash(this.savePath);
      const currentDirSize = await Utility.calculateDirectorySize(this.savePath);

      const matchingSave = this.availableLocalSaves
        .filter(save => save.directoryHash === currentDirHash && save.directorySize === currentDirSize)
        .sort((a, b) => b.createTime - a.createTime)[0];

      this.currentSave_ = matchingSave || null;
    } catch (error) {
      this.currentSave_ = null;
    }
  }

  async notifyRollbackComplete(save: Save): Promise<void> {
    await this.updateCurrentSave();
    this.activityUpdate$.next(this.id);
  }

  private db_: LocalGameDB;
  private cloudSaveNum_: number;
  private enableCloudSave_: boolean;
  private saves_: (Save | RemoteSave)[];
  private history_: GameHistoryDB[];
  private coverImage_: CacheImage;
  private state_: BehaviorSubject<GameState>;
  private runningProcess_: Set<string>;
  private processOb_?: Subscription;
  private gameStartTime_: number;
  private error?: BaseError;
  private iconPath_?: string;
  private currentSave_: Save | null;

  private processMonitorService_: ProcessMonitorService;
  private settingService_: SettingService;
  private gameService_: GameService;
  private serverService_: ServerService;
  private userService_: UserService;
  private ossService_: OssService;
  private gameActivityService_: GameActivityService;
  private saveTransferService_: SaveTransferService;
  public activityUpdate$: BehaviorSubject<string>;

  private guideWindowId_: number;
}

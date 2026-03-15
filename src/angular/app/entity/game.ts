import {BehaviorSubject, Subscription} from 'rxjs';
import {CacheImage} from '../library/cache-image';
import {App, GameUtil, UnixTime, Utility} from '../library/utility';
import {BaseError} from '../library/error/BaseError';
import {ErrorCode} from '../library/error/ErrorCode';
import {ProcessEventType, ProcessMonitorService} from '../service/process-monitor.service';
import {v4} from 'uuid';
import {PathUtil} from '../library/path-util';
import {Save} from './save';
import {SettingService} from '../service/setting.service';
import {GameService} from '../service/game.service';
import {GameHistory, UserGame} from '../service/server/api';
import {ServerService} from '../service/server/server.service';
import {UserService} from '../service/user.service';
import {OssService} from '../service/oss.service';
import {RemoteSave} from './remote-save';
import {GameActivityService} from '../service/game-activity.service';
import {workerAPI} from '../library/api/worker-api';
import {LocalGameDB} from '../database/game';
import {GameHistoryDB} from '../database/game-history';
import {SaveDB} from '../database/save';
import {GameActivityType} from '../database/game-activity';
import {mainAPI} from '../library/api/main-api';
import {Base64} from 'js-base64';

export enum GameState {
  Init = 1,
  Checked = 2,
  Running = 3,
  Saving = 4,

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
      const target = PathUtil.resolve(this.backupSavePath, 'icon.png');
      const iconData = await workerAPI.icon.extractFileIcon({
        exePath: this.exeFilePath,
        targetPath: target,
      });
      this.iconPath_ = `data:image/png;base64,${Base64.fromUint8Array(iconData)}`;
    }
  }

  async init() {
    this.updateRunningInfo();
    const saveDBList = await workerAPI.db.findSaves(this.id);

    for (const saveDB of saveDBList) {
      const save = new Save(saveDB, this);
      this.saves_.push(save);
    }

    this.syncSaveList();
    this.syncGameHistory();

    const historyList = await workerAPI.db.findGameHistory(this.id);
    this.history_ = historyList;
    await this.checkIcon();
    await this.updateCurrentSave();
    await this.checkState();
  }

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
      const list = await this.serverService_.business.fetchGameSave({
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
    }
  }

  async syncGameHistory() {
    if (this.userService_.isOnline()) {
      const list = await this.serverService_.business.fetchGameHistory({
        gameId: this.id,
        lastSyncTime: this.db_.lastGameHistorySyncTime || 0,
      });

      await this.syncGameHistoryFromServer(list);

    }
  }

  async syncGameHistoryFromServer(list: Omit<GameHistory, 'accountId'>[]) {
    for (const history of list) {
      const existing = await workerAPI.db.findOneGameHistory(history.id);

      if (!existing) {
        const historyDB = new GameHistoryDB({
          id: history.id,
          gameId: history.gameId,
          host: history.host,
          startTime: history.startTime,
          endTime: history.endTime,
          synced: 1,
          createTime: history.createTime,
        });
        await workerAPI.db.saveGameHistory(historyDB);
        this.addHistory(historyDB);
      } else {
        existing.startTime = history.startTime;
        existing.endTime = history.endTime;
        existing.host = history.host;
        existing.createTime = history.createTime;
        existing.synced = 1;
        await workerAPI.db.saveGameHistory(existing);
      }
    }

    await this.updateLastGameHistorySyncTime(UnixTime.now());
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
    await workerAPI.fs.deleteDir({
      path: this.backupSavePath,
      options: {
        recursive: true
      }
    });
    await workerAPI.db.deleteSavesByGame(this.id);
    await workerAPI.db.deleteGameActivityByGame(this.id);
    await workerAPI.db.deleteGameGuidByGame(this.id);
    await workerAPI.db.deleteGameHistoryByGame(this.id);
    await workerAPI.db.deleteGame(this.id);
  }

  async onGameProcessStart() {
    this.gameStartTime_ = UnixTime.now();
  }

  async onGameProcessExit() {
    const endTime = UnixTime.now();
    const historyDB = new GameHistoryDB({
      id: v4(),
      gameId: this.id,
      host: App.hostname(),
      startTime: this.gameStartTime_,
      endTime: endTime,
      synced: 0,
      createTime: endTime,
    })

    await workerAPI.db.saveGameHistory(historyDB);
    this.history_ = [...this.history_, historyDB];
    this.activityUpdate$.next(this.id);
    this.gameStartTime_ = 0;

    await this.zipSave();

    this.syncGameHistoryToServer([historyDB]).catch((error) => {
      console.error('同步游戏历史记录失败:', error);
      // this.errorHandlingUtil.handleAutoError(error, `游戏历史记录同步失败`);
    });

    if (this.db_.autoOpenGuide) {
      await mainAPI.window.closeGameGuideWindow(this.guideWindowId_);
    }
  }

  async uploadSave(save: Save) {
    if (this.userService_.isOnline() && this.enableCloudSave_) {
      return this.ossService_.uploadGameSave(save);
    }
    return false;
  }

  async openGameGuide() {
    const id = await mainAPI.window.createGameGuideWindow({
      gameId: this.id,
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
      workerAPI.process.spawn({
        exe: this.settingService_.LEExePath,
        params: ['-runas', this.extractSetting.LEProfile, this.exeFilePath]
      });
    } else {
      workerAPI.process.spawn({
        exe: this.exeFilePath,
        cwd: PathUtil.dirname(this.exeFilePath),
      });
    }

    if (this.db_.autoOpenGuide) {
      this.openGameGuide();
    }
  }

  async openSavePath() {
    return mainAPI.shell.openPath(this.savePath);
    // return shell.openPath(this.savePath);
  }

  async openGamePath() {
    return mainAPI.shell.openPath(this.gamePath);
  }

  // async createSaveZip() {
  //   const zip = new JSZip();
  //   const files = await workerAPI.fs.readdirRecursive(this.savePath); // Utility.readdir(this.savePath);
  //   for (const file of files) {
  //     const content = await fs.readFile(path.join(this.savePath, file));
  //     zip.file(file, content as any);
  //   }
  //   return zip.generateNodeStream();
  // }

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

      // if (!force && await this.checkSaveSizeExceeded()) {
      //   this.setState(GameState.SaveSizeExceeded);
      //   return;
      // }

      this.setState(GameState.Saving);
      const directoryHash = await Utility.calculateDirectoryHash(this.savePath);
      const currentSave = this.currentSave_;
      if (currentSave && directoryHash === currentSave.directoryHash && !force) {
        return;
      }

      const directorySize = await Utility.calculateDirectorySize(this.savePath);
      const id = v4();
      const saveZipFilePath = PathUtil.join(this.backupSavePath, id + '.zip');

      await workerAPI.fs.mkdir({
        path: PathUtil.dirname(saveZipFilePath),
        options: {
          recursive: true,
        },
      });

      const zipRes = await workerAPI.zip.createZipFromDirectory({
        dirPath: this.savePath,
        zipPath: saveZipFilePath,
      });

      // const saveStat = await fs.stat(saveZipFilePath);
      const zipHash = await Utility.calculateFileHash(saveZipFilePath);

      const saveDB = new SaveDB({
        id,
        gameId: this.id,
        createTime: UnixTime.now(),
        updateTime: UnixTime.now(),
        remark: '',
        hostname: App.hostname(),
        size: zipRes.zipSize,
        started: false,
        directoryHash,
        directorySize,
        zipHash,
      })
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
      console.log(err);
      this.onError(err as BaseError);
      await this.gameActivityService_.createActivity(this.id, GameActivityType.SAVE_BACKUP_LOCAL_FAILED, {reason: (err as BaseError).code || (err as Error).message});
    }
    this.checkState();
  }

  async checkIcon() {
    const iconPath = PathUtil.join(this.backupSavePath, 'icon.png');
    const exists = await workerAPI.fs.exists(iconPath);
    if (exists) {
      console.log('read icon');
      const iconData = await workerAPI.fs.readFile(iconPath);
      this.iconPath_ = `data:image/png;base64,${Base64.fromUint8Array(iconData)}`;
    } else {
      await this.loadIcon();
    }
  }

  async checkState() {
    if (!await workerAPI.fs.exists(this.savePath)) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_SAVE_PATH_NOT_FOUND));
      return;
    }

    if (!await workerAPI.fs.exists(this.gamePath)) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_PATH_NOT_FOUND));
      return;
    }

    if (!await workerAPI.fs.exists(this.exeFilePath)) {
      this.onError(new BaseError(ErrorCode.ERR_GAME_EXE_NOT_FOUND));
      return;
    }

    if (this.runningProcess_.size) {
      this.setState(GameState.Running);
      return;
    }

    this.setState(GameState.Checked);
  }

  setState(state: GameState) {
    this.state_.next(state);
  }

  async save(syncToServer = true) {
    this.db_ = await workerAPI.db.saveGame(this.db_);
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

  async syncGameHistoryToServer(histories: Array<GameHistoryDB>) {
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

      await this.loadServerGameHistory(result);
    } catch (error) {
      console.error('同步游戏历史记录到服务器失败:', error);
      throw error;
    }
  }

  private async loadServerGameHistory(list: GameHistory[]) {
    for (const item of list) {
      const existing = this.history_.find(h => h.id === item.id);
      if (!existing) {
        const historyDB = new GameHistoryDB({
          id: item.id,
          gameId: item.gameId,
          host: item.host,
          startTime: item.startTime,
          endTime: item.endTime,
          synced: 1,
          createTime: item.createTime,
        });
        await workerAPI.db.saveGameHistory(historyDB);
        this.history_ = [...this.history_, historyDB];
      } else {
        existing.synced = 1;
        existing.createTime = item.createTime;

        await workerAPI.db.saveGameHistory(existing);
      }
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
      await this.syncGameHistoryToServer(unsyncedHistories);
    } catch (error) {
      console.error('同步未同步的游戏历史记录失败:', error);
      throw error;
    }
  }

  addHistory(history: GameHistoryDB) {
    this.history_ = [...this.history_, history];
    this.notifyActivityUpdate();
  }

  async updateLastGameHistorySyncTime(time: number) {
    this.db_.lastGameHistorySyncTime = time;
    await this.save(false);
  }

  getCurrentSave(): Save | null {
    return this.currentSave_;
  }

  async updateCurrentSave(): Promise<void> {
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

  notifyActivityUpdate() {
    this.activityUpdate$.next(this.id);
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
    return PathUtil.join('.', 'data', 'saves', this.id);
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
    return PathUtil.join(this.db_.gamePath, this.db_.exeFile);
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

  get serverService() {
    return this.serverService_;
  }

  get userService() {
    return this.userService_;
  }

  get iconPath() {
    return this.iconPath_;
  }

  get ossService() {
    return this.ossService_;
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
  public activityUpdate$: BehaviorSubject<string>;

  private guideWindowId_: number;
}

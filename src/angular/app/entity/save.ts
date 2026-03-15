import {PathUtil} from '../library/path-util';
import {Game} from './game';
import {UnixTime} from '../library/utility';
import {UserGameSave} from '../service/server/api';
import {SaveDB} from '../../../shared/database/save';
import {workerAPI} from '../library/api/worker-api';

export enum SaveState {
  LocalAndRemote = 1,
  Local = 2,
  Remote = 3,
  Deleted = 99,
  Current = 100,
}

export class Save {
  constructor(saveDB: SaveDB, game: Game) {
    this.db_ = saveDB;
    this.game_ = game;
    this.ossPath_ = null;
    this.deleted_ = false;
    this.init();
  }

  init() {
    workerAPI.fs.exists(this.filename).then(exists => {
      if (!exists)
        this.deleted_ = true;
    });
  }

  removeOssPath() {
    this.ossPath_ = null;
  }

  async download() {
    if (!this.ossPath)
      return;

    await this.game.ossService.downloadGameSave(this);
    this.deleted_ = false;
  }

  async save(syncToSerer: boolean) {
    this.db_ = await workerAPI.db.saveSave(this.db_);
    if (syncToSerer) {
      this.syncToServer();
    }
  }

  async star() {
    this.stared = !this.stared;
    if (this.stared)
      await this.game.uploadSave(this);
  }

  syncFromServer(save: UserGameSave) {
    if (this.updateTime > save.updateTime) {
      return;
    }

    this.db_.remark = save.remark;
    this.db_.started = save.stared;
    this.db_.hostname = save.hostname;
    this.db_.updateTime = save.updateTime;
    this.db_.directoryHash = save.directoryHash;
    this.db_.zipHash = save.zipHash;
    this.db_.directorySize = save.directorySize ? parseInt(save.directorySize) : null;
    this.ossPath_ = save.ossPath;
    this.save(false);
  }

  async syncToServer() {
    if (this.game.userService.logged.getValue()) {
      await this.game.serverService.business.syncGameSave(this.syncData);
    }
  }

  async rollback() {
    if (this.deleted)
      return;

    await workerAPI.zip.extractZip({
      zipFilePath: this.filename,
      targetPath:  this.game_.savePath,
    });

    this.game_.updateCurrentSave();
    this.game_.notifyActivityUpdate();
  }

  async delete() {
    if (this.deleted)
      return;
    await workerAPI.fs.deleteFile(this.filename);
    this.deleted_ = true;
  }

  get syncData() {
    return {
      gameId: this.game.id,
      saveId: this.id,
      remark: this.remark,
      stared: this.stared,
      hostname: this.hostname,
      updateTime: this.updateTime,
      createTime: this.createTime,
      directoryHash: this.directoryHash,
      zipHash: this.zipHash,
      directorySize: this.directorySize?.toString(),
    };
  }

  get id()  {
    return this.db_.id;
  }

  get filename() {
    return PathUtil.join(this.game_.backupSavePath, this.db_.id + '.zip');
  }

  get createTime() {
    return this.db_.createTime;
  }

  get remark() {
    return this.db_.remark;
  }

  set remark(value: string) {
    this.db_.remark = value;
    this.db_.updateTime = UnixTime.now();
  }

  get hostname() {
    return this.db_.hostname;
  }

  get size() {
    return this.db_.size;
  }

  set size(value: number) {
    this.db_.size = value;
  }

  get stared() {
    return this.db_.started;
  }

  set stared(value: boolean) {
    this.db_.started = value;
    this.db_.updateTime = UnixTime.now();
  }

  get deleted() {
    return this.deleted_;
  }

  get updateTime() {
    return this.db_.updateTime;
  }

  get isAvailable() {
    return !this.deleted_ || this.ossPath_;
  }

  get onlyRemote() {
    return this.deleted_ && this.ossPath_;
  }

  get state() {
    if (this.game_.getCurrentSave() === this) {
      return SaveState.Current;
    }
    if (this.ossPath_ && !this.deleted) {
      return SaveState.LocalAndRemote;
    }
    if (this.ossPath_ && this.deleted) {
      return SaveState.Remote;
    }
    if (this.deleted) {
      return SaveState.Deleted;
    }
    return SaveState.Local;
  }

  get game() {
    return this.game_;
  }

  get ossPath() {
    return this.ossPath_;
  }

  set ossPath(value: string | null) {
    this.ossPath_ = value;
  }

  get available() {
    return !this.deleted_;
  }

  get directoryHash(): string | null {
    return this.db_.directoryHash;
  }

  get zipHash(): string | null {
    return this.db_.zipHash;
  }

  get directorySize(): number | null {
    return this.db_.directorySize;
  }

  private db_: SaveDB;
  private game_: Game;
  private deleted_: boolean;
  private ossPath_: string | null;
}

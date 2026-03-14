import {UserGameSave} from '../service/server/api';
import {Game} from './game';
import {Save, SaveState} from './save';
import {PathUtil} from '../library/path-util';
import {SaveDB} from '../../../shared/database/save';
import {workerAPI} from 'app/library/api/worker-api';

export class RemoteSave {
  constructor(game: Game, data: UserGameSave) {
    this.data_ = data;
    this.game_ = game;
  }

  async download() {
    const res = await this.game_.serverService.business.signGameSaveUrl({url: this.data_.ossPath});
    await workerAPI.oss.downloadSave({
      url: res.url,
      savePath: this.filename,
    });

    const saveDB = new SaveDB({
      id: this.id,
      gameId: this.game.id,
      createTime: this.data_.createTime,
      updateTime: this.data_.updateTime,
      remark: this.data_.remark,
      hostname: this.data_.hostname,
      size: parseInt(this.data_.size, 10),
      started: this.data_.stared,
      directoryHash: this.data_.directoryHash,
      zipHash: this.data_.zipHash,
      directorySize: this.data_.directorySize ? parseInt(this.data_.directorySize) : null,
    });
    const save = new Save(saveDB, this.game);
    save.ossPath = this.ossPath;
    save.save(false);
    return save;
  }

  get filename() {
    return PathUtil.join(this.game_.backupSavePath, this.id + '.zip');
  }

  syncFromServer(save: UserGameSave) {
    this.data_ = save;
  }

  get id()  {
    return this.data_.saveId;
  }

  get createTime() {
    return this.data_.createTime;
  }

  get remark() {
    return this.data_.remark;
  }

  get hostname() {
    return this.data_.hostname;
  }

  get size() {
    return parseInt(this.data_.size);
  }


  get stared() {
    return this.data_.stared;
  }

  get updateTime() {
    return this.data_.updateTime;
  }

  get state() {
    return SaveState.Remote;
  }

  get game() {
    return this.game_;
  }

  get ossPath() {
    return this.data_.ossPath;
  }

  get available() {
    return true;
  }

  private data_: UserGameSave;
  private game_: Game;
}

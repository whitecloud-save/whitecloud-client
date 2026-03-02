import {BehaviorSubject} from 'rxjs';
import {CacheImage} from '../library/cache-image';
import {UserGame} from '../service/server/api';
import {GameState} from './game';
import {ServerService} from '../service/server/server.service';

export class RemoteGame {
  constructor(data: UserGame, serverService: ServerService) {
    this.data_ = data;
    this.coverImage_ = new CacheImage(data.gameCoverImgUrl!, serverService);
    this.cloudSaveNum_ = data.cloudSaveNum;
    this.state_ = new BehaviorSubject<GameState>(GameState.Cloud);
  }

  syncFromServer(data: Pick<UserGame, 'updateTime' | 'name' | 'exePath' | 'savePath' | 'gameCoverImgUrl' | 'cloudSaveNum'>) {
    if (this.updateTime > data.updateTime)
      return;

    this.data_.name = data.name;
    this.data_.exePath = data.exePath;
    if (data.savePath) {
      this.data_.savePath = data.savePath;
    }
    if (data.gameCoverImgUrl) {
      this.data_.gameCoverImgUrl = data.gameCoverImgUrl;
    }
    this.cloudSaveNum_ = data.cloudSaveNum;
    this.data_.updateTime = data.updateTime;
  }

  get name() {
    return this.data_.name;
  }

  get id() {
    return this.data_.gameId;
  }

  get cachedCoverImgUrl() {
    return this.coverImage_.url;
  }

  get coverImgUrl() {
    return this.data_.gameCoverImgUrl;
  }

  get order() {
    return this.data_.order;
  }

  get updateTime() {
    return this.data_.updateTime;
  }

  get state() {
    return this.state_;
  }

  get exePath() {
    return this.data_.exePath;
  }

  get savePath() {
    return this.data_.savePath;
  }

  get cloudSaveNum() {
    return this.cloudSaveNum_;
  }

  private data_: UserGame;
  private coverImage_: CacheImage;
  private cloudSaveNum_: number;
  private state_: BehaviorSubject<GameState>;
}

import {Injectable} from '@angular/core';
import {Game} from '../entity/game';
import {Observable, Subscriber} from 'rxjs';

export enum HeaderType {
  Home = 'home',
  GameDetail = 'game-detail',
  Setting = 'setting',
}

export interface IHomeHeaderData {
  type: HeaderType.Home;
}

export interface IGameHeaderData {
  type: HeaderType.GameDetail;
  data: Game;
}

export interface ISettingHeaderData {
  type: HeaderType.Setting;
}

export type HeaderData = IHomeHeaderData | IGameHeaderData | ISettingHeaderData;

@Injectable({
  providedIn: 'root',
})
export class MainService {

  header: Observable<HeaderData>;

  private headerSub!: Subscriber<HeaderData>;

  constructor() {
    this.header = new Observable((sub) => {
      this.headerSub = sub;
    });
  }

  setHeader(data: HeaderData) {
    this.headerSub.next(data);
  }
}

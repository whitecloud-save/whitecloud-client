import {Client, IWorkerChannel} from './client';
import type {AppHandler} from '../../../../electron/handler/main-handler/app-handler';
import type {DialogHandler} from '../../../../electron/handler/main-handler/dialog-handler';
import type {MenuHandler} from '../../../../electron/handler/main-handler/menu-handler';
import type {ShellHandler} from '../../../../electron/handler/main-handler/shell-handler';
import type {WindowHandler} from '../../../../electron/handler/main-handler/window-handler';

declare const window: ClientWindow;
export interface ClientWindow {
  mainChannel: IWorkerChannel;
}

export class MainAPI {
  private static instance_: MainAPI | null = null;
  private client_: Client;

  private constructor() {
    this.client_ = new Client(window.mainChannel);
  }

  static getInstance(): MainAPI {
    if (!MainAPI.instance_) {
      MainAPI.instance_ = new MainAPI();
    }
    return MainAPI.instance_;
  }

  get app() {
    return this.client_.createApi<AppHandler>('app');
  }

  get dialog() {
    return this.client_.createApi<DialogHandler>('dialog');
  }

  get menu() {
    return this.client_.createApi<MenuHandler>('menu');
  }

  get shell() {
    return this.client_.createApi<ShellHandler>('shell');
  }

  get window() {
    return this.client_.createApi<WindowHandler>('window');
  }
}

export const mainAPI = MainAPI.getInstance();

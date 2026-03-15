import {Route} from '@sora-soft/framework';
import {BrowserWindow} from 'electron';
import {Manager} from '../../manager.js';

export class WindowHandler extends Route {
  constructor(win: BrowserWindow, serve: boolean) {
    super();
    this.serve_ = serve;
    this.win_ = win;
  }

  private gameGuideWindows_: Map<number, {uuid: string, win: BrowserWindow}> = new Map();
  private serve_: boolean;
  private win_: BrowserWindow;

  @Route.method
  async createGameGuideWindow(body: {gameId: string, title: string}): Promise<number> {
    const id = await Manager.createGameGuideWindow(body.title, body.gameId, this.serve_);
    return id;
  }

  @Route.method
  async closeGameGuideWindow(windowId: number): Promise<void> {
    const data = this.gameGuideWindows_.get(windowId);
    if (data) {
      data.win.close();
    }
  }

  @Route.method
  async setWindowTop(top: boolean): Promise<void> {
    this.win_.setAlwaysOnTop(top);
  }
}

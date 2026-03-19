import {Notify, Route} from '@sora-soft/framework';
import {BrowserWindow} from 'electron';
import {Manager} from '../../manager.js';
import {pack} from 'msgpackr';

export class WindowHandler extends Route {
  constructor(win: BrowserWindow, serve: boolean) {
    super();
    this.serve_ = serve;
    this.win_ = win;
  }

  private serve_: boolean;
  private win_: BrowserWindow;

  @Route.method
  async createGameGuideWindow(body: {gameId: string, title: string}): Promise<number> {
    const id = await Manager.createGameGuideWindow(body.title, body.gameId, this.serve_);
    return id;
  }

  @Route.method
  async closeGameGuideWindow(gameId: string) {
    await Manager.closeGameGuideWindow(gameId);
    return {};
  }

  @Route.method
  async createSaveFinderWindow(body: {gamePath: string, exePath: string}) {
    const id = await Manager.createSaveFinderWindow(body.gamePath, body.exePath, this.serve_);
    return id;
  }

  @Route.method
  async closeSaveFinderWindow(body: void) {
    await Manager.closeSaveFinderWindow();
    Manager.focusMain();
    return {};
  }

  @Route.method
  async setWindowTop(top: boolean): Promise<void> {
    this.win_.setAlwaysOnTop(top);
  }

  @Route.method
  async notifyToMain(body: {method: string, payload: unknown}) {
    const connector = Manager.mainWindowConnector;
    if (!connector)
      throw new Error('main window channel not found');

     const notify = new Notify({
      method: body.method,
      headers: {},
      service: 'electron',
      payload: body.payload,
    });
    connector.sendNotify(notify);

    return {};
  }
}

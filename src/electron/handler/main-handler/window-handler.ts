import {Route} from '@sora-soft/framework';
import {BrowserWindow} from 'electron';

export class WindowHandler extends Route {
  private gameGuideWindows_: Map<number, BrowserWindow> = new Map();

  @Route.method
  async createGameGuideWindow(gameId: string, title: string): Promise<number> {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      title: title,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const windowId = win.id;
    this.gameGuideWindows_.set(windowId, win);

    win.on('closed', () => {
      this.gameGuideWindows_.delete(windowId);
    });

    return windowId;
  }

  @Route.method
  async closeGameGuideWindow(windowId: number): Promise<void> {
    const win = this.gameGuideWindows_.get(windowId);
    if (win) {
      win.close();
    }
  }

  @Route.method
  async setWindowTop(windowId: number, top: boolean): Promise<void> {
    const win = this.gameGuideWindows_.get(windowId);
    if (win) {
      win.setAlwaysOnTop(top);
    }
  }
}

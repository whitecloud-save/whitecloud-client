import {Route} from '@sora-soft/framework';
import {app} from 'electron';
import {hostname} from 'os';

export class AppHandler extends Route {
  constructor(winId: number, module: string, data: unknown) {
    super();
    this.winId_ = winId;
    this.data_ = data;
    this.module_ = module;
  }

  @Route.method
  async getVersion(body: void): Promise<string> {
    return app.getVersion();
  }

  @Route.method
  async getLoginItemSettings(body: void): Promise<{ openAtLogin: boolean }> {
    const settings = app.getLoginItemSettings();
    return {
      openAtLogin: settings.openAtLogin,
    };
  }

  @Route.method
  async setLoginItemSettings(settings: { openAtLogin: boolean }): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: settings.openAtLogin,
    });
  }

  @Route.method
  async isPackaged(): Promise<boolean> {
    return app.isPackaged;
  }

  @Route.method
  async getAppPath(name: string): Promise<string> {
    return app.getPath(name as any);
  }

  @Route.method
  async getResourcesPath(): Promise<string> {
    return app.isPackaged ? process.resourcesPath : app.getAppPath();
  }

  @Route.method
  async startApplication(body: void) {
    // const win = getWin();
    const systemPath = {
      appData: app.getPath('appData'),
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      cwd: process.cwd(),
    };

    return {
      module: this.module_,
      path: systemPath,
      hostname: hostname(),
      data: this.data_,
      winId: this.winId_,
    };

    // const data = childWinMap.get(winId);
    // if (data) {
    //   return {
    //     module: 'guide',
    //     gameId: data.uuid,
    //     path: systemPath,
    //     hostname: hostname(),
    //   };
    // }

    // return null;
  }

  private module_: string;
  private data_: unknown;
  private winId_: number;
}

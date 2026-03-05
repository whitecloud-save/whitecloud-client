import {Route} from '@sora-soft/framework';
import {shell} from 'electron';

export class ShellHandler extends Route {
  @Route.method
  async openPath(path: string): Promise<void> {
    await shell.openPath(path);
  }

  @Route.method
  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url);
  }
}

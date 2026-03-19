import {Connector, Notify, Request, Route} from '@sora-soft/framework';
import {clipboard, shell} from 'electron';
import {EtwManager} from '../../etw.js';

export class ShellHandler extends Route {
  @Route.method
  async openPath(path: string): Promise<void> {
    await shell.openPath(path);
  }

  @Route.method
  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url);
  }

  @Route.method
  async startEtwMonitor(pids: number[], request: Request, connector: Connector) {
    await EtwManager.startMonitor(pids, (file) => {
      console.log(file);
      const callbackId = request.getHeader('callback-id');
      if (callbackId) {
        const notify = new Notify({
          method: 'rpc-callback',
          service: 'electron',
          headers: {
            'callback-id': callbackId,
          },
          payload: {
            file,
          },
        });
        connector.sendNotify(notify);
      }
    });
    return {};
  }

  @Route.method
  async stopEtwMonitor(body: void) {
    await EtwManager.closeMonitor();
    return {};
  }

  @Route.method
  async writeClipboard(text: string) {
    clipboard.writeText(text);
    return {};
  }
}

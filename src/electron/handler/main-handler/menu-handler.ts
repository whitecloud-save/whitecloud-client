import {Connector, Notify, Route, Request} from '@sora-soft/framework';
import {Menu, nativeImage} from 'electron';

export interface IElectronMenuItem {
  id?: string;
  label?: string;
  icon?: {
    path: string;
    width: number;
    height: number;
  };
  type?: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio');
}

export class MenuHandler extends Route {

  @Route.method
  async popMenu(body: IElectronMenuItem[], request: Request, connector: Connector) {
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];
    for (const i of body) {
      const item = {} as  (Electron.MenuItemConstructorOptions | Electron.MenuItem);
      if (i.label) {
        item.label = i.label;
      }

      if (i.icon) {
        const icon = nativeImage.createFromDataURL(i.icon.path).resize({
          width: i.icon.width,
          height: i.icon.height,
        });
        item.icon = icon;
      }

      if (i.type) {
        item.type = i.type;
      }

      if (i.id) {
        item.click = () => {
          const callbackId = request.getHeader('callback-id');
          if (callbackId) {
            const notify = new Notify({
              method: 'rpc-callback',
              service: 'electron',
              headers: {
                'callback-id': callbackId,
              },
              payload: {
                id: i.id,
              },
            });
            connector.sendNotify(notify);
          }
        }
      }

      template.push(item);
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }
}

import {enableProdMode} from '@angular/core';
import {Client, type IWorkerChannel} from './app/library/worker-api';
import {type WorkerHandler} from '../electron/handler/worker-handler';

declare const window: ClientWindow;

export interface ClientWindow {
  workerChannel: IWorkerChannel;
}

// if (APP_CONFIG.production) {
//   enableProdMode();
// }

export const GuideGameId = Symbol('guid-game-id');

(async () => {
  await window.workerChannel.ready();

  const client = new Client(window.workerChannel);
  const api = client.createApi<WorkerHandler>();

  console.log('call api.test');
  const res = await api.test(undefined);
  console.log(res);

  // await connect();
  // const value = await ipcRenderer.invoke('start');
  // switch(value.module) {
  //   case 'main':
  //     platformBrowserDynamic()
  //       .bootstrapModule(AppModule, {
  //         preserveWhitespaces: false,
  //       })
  //       .catch(err => console.error(err));
  //     break;
  //   case 'guide':
  //     platformBrowserDynamic(
  //       [{provide: GuideGameId, useValue: value.gameId}]
  //     )
  //       .bootstrapModule(GameGuideModule, {
  //         preserveWhitespaces: false,
  //       })
  //       .catch(err => console.error(err));
  //     break;
  // }
})();

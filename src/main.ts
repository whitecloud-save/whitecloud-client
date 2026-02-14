import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {APP_CONFIG} from './environments/environment';
import {connect} from './app/library/database';
import {ipcRenderer} from 'electron';
import {GameGuideModule} from './app/game-guide.module';

if (APP_CONFIG.production) {
  enableProdMode();
}

export const GuideGameId = Symbol('guid-game-id');

(async () => {
  await connect();
  const value = await ipcRenderer.invoke('start');
  switch(value.module) {
    case 'main':
      platformBrowserDynamic()
        .bootstrapModule(AppModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
    case 'guide':
      platformBrowserDynamic(
        [{provide: GuideGameId, useValue: value.gameId}]
      )
        .bootstrapModule(GameGuideModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
  }
})();

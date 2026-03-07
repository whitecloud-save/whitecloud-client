import {enableProdMode} from '@angular/core';
import {APP_CONFIG} from './environments/environment';
import {mainAPI} from './app/library/api/main-api';
import {AppModule} from './app/app.module';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {GameGuideModule} from './app/game-guide.module';
import {App} from './app/library/utility';

if (APP_CONFIG.production) {
  enableProdMode();
}

export const GuideGameId = Symbol('guid-game-id');

(async () => {
  const value = await mainAPI.app.startApplication();
  if (!value)
    return;
  App.init(value.path, value.hostname);

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
        [{provide: GuideGameId, useValue: value.data}]
      )
        .bootstrapModule(GameGuideModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
  }
})();

import {enableProdMode} from '@angular/core';
import {APP_CONFIG} from './environments/environment';
import {mainAPI} from './app/library/api/main-api';
import {AppModule} from './app/app.module';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {GameGuideModule} from './app/game-guide.module';
import {App} from './app/library/utility';
import {FinderModule} from 'app/finder.module';

if (APP_CONFIG.production) {
  enableProdMode();
}

export const GuideGameId = Symbol('guid-game-id');
export const GamePath = Symbol('game-path');
export const ExePath = Symbol('exe-path');

(async () => {
  const value = await mainAPI.app.startApplication();
  if (!value)
    return;
  App.init(value.path, value.hostname);

  switch(value.module) {
    case 'main': {
      platformBrowserDynamic()
        .bootstrapModule(AppModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
    }
    case 'guide': {
      const data = value.data as {gameId: string};
      platformBrowserDynamic(
        [{provide: GuideGameId, useValue: data.gameId}]
      )
        .bootstrapModule(GameGuideModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
    }
    case 'finder':
      const data = value.data as {gamePath: string, exePath: string};
      platformBrowserDynamic(
        [
          {provide: GamePath, useValue: data.gamePath},
          {provide: ExePath, useValue: data.exePath},
        ]
      )
        .bootstrapModule(FinderModule, {
          preserveWhitespaces: false,
        })
        .catch(err => console.error(err));
      break;
  }
})();

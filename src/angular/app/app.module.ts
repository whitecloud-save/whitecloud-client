import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {RouteReuseStrategy} from '@angular/router';

import {AppComponent} from './app.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NzModalService} from 'ng-zorro-antd/modal';
import {GameService} from './service/game.service';
import {NzImageModule} from 'ng-zorro-antd/image';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {UserOutline} from '@ant-design/icons-angular/icons';
import {SettingService} from './service/setting.service';
import {ServerService} from './service/server/server.service';
import {WebsocketServerService} from './service/server/websocket-server.service';
import {ErrorHandlerService} from './service/error-handler.service';
import {UserService} from './service/user.service';
import {NzTypographyModule} from 'ng-zorro-antd/typography';
import {GameRouteReuseStrategy} from './game-route-reuse-strategy';
import {UpdateService} from './service/update.service';
import {DialogService} from './service/dialog.service';

@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        FontAwesomeModule,
        NzImageModule,
        NzTypographyModule,
        NzIconModule.forRoot([UserOutline])], providers: [
        NzModalService,
        { provide: ServerService, useClass: WebsocketServerService },
        { provide: ErrorHandler, useClass: ErrorHandlerService },
        { provide: RouteReuseStrategy, useClass: GameRouteReuseStrategy },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {
  constructor(
    private gameService: GameService,
    private settingService: SettingService,
    private updateService: UpdateService,
  ) {
    this.startup();
  }

  async startup() {
    await this.settingService.load();
    await this.gameService.init();
    await this.updateService.onApplicationStartup();
  }
}

import {Component, Input, NgZone} from '@angular/core';
import {Game} from '../../../entity/game';
import {Menu, Tray} from '@electron/remote';
import {MenuItem, MenuItemConstructorOptions, nativeImage} from 'electron';
import {GameService} from '../../../service/game.service';
import {NzModalService} from 'ng-zorro-antd/modal';
import {Router} from '@angular/router';
import {RemoteGame} from '../../../entity/remote-game';
import {DialogService} from '../../../service/dialog.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';
import {UserService} from '../../../service/user.service';
import {RemoteSave} from '../../../entity/remote-save';
import {Save} from '../../../entity/save';

@Component({
  selector: 'app-game-cover',
  templateUrl: './game-cover.component.html',
  styleUrl: './game-cover.component.scss',
})
export class GameCoverComponent {
  @Input()
  game!: Game | RemoteGame;

  constructor(
    public gameService: GameService,
    public userService: UserService,
    public modal: NzModalService,
    private zone: NgZone,
    private router: Router,
    private dialog: DialogService,
    private message: NzMessageService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {}

  navigate() {
    if (this.game instanceof Game) {
      this.router.navigate(['main', 'game', this.game.id]);
    }
    if (this.game instanceof RemoteGame) {
      this.dialog.openSyncGameDialog(this.game);
    }
  }

  async openGameContextMenu() {
    if (this.game instanceof Game) {
      const game = this.game;

      let icon = undefined;
      if (game.iconPath) {
        icon = await nativeImage.createThumbnailFromPath(game.iconPath, {width: 16, height: 16});
      }
      const template: Array<(MenuItemConstructorOptions) | (MenuItem)> = [{
        label: this.game.name,
        icon: icon,
        click: () => {
          this.router.navigate(['/main/game/' + this.game.id]);
        },
      }, {
        type: 'separator',
      }, {
        label: '启动游戏',
        click: () => {
          this.zone.run(async () => {
            await this.startGameWithCloudSaveCheck(game);
          });
        },
      }, {
        label: '从库中移除',
        click: () => {
          this.zone.run(() => {
            this.modal.confirm({
              nzTitle: `从库中移除${this.game.name}`,
              nzContent: `确认从库中移除${this.game.name}？已备份的本地存档都将被删除且无法恢复`,
              nzOkType: 'primary',
              nzOkDanger: true,
              nzOkText: '移除',
              nzOnOk: () => {
                this.gameService.removeLocalGame(game);
              },
            });
          });
        },
      }];
      const menu = Menu.buildFromTemplate(template);
      menu.popup({});

    }

    if (this.game instanceof RemoteGame) {
      const game = this.game;
      const template: Array<(MenuItemConstructorOptions) | (MenuItem)> = [{
        label: this.game.name,
        click: () => {
          this.zone.run(() => {
            this.dialog.openSyncGameDialog(game);
          });
        },
      }, {
        type: 'separator',
      }, {
        label: '同步到本地',
        click: () => {
          this.zone.run(() => {
            this.dialog.openSyncGameDialog(game);
          });
        },
      }, {
        label: '从云端移除',
        click: () => {
          this.zone.run(() => {
            this.modal.confirm({
              nzTitle: `从云端移除${this.game.name}`,
              nzContent: `确认从云端移除${this.game.name}？这个操作将同步到所有登录本账号的客户端中，且无法撤销`,
              nzOkType: 'primary',
              nzOkDanger: true,
              nzOkText: '移除',
              nzOnOk: () => {
                this.gameService.syncRemoveRemoteGame(game)
                  .then(() => {
                    this.message.success('移除成功');
                  })
                  .catch((err) => {
                    this.errorHandlingUtil.handleManualError(err, '从云端移除游戏失败');
                  });
              },
            });
          });
        },
      }];
      const menu = Menu.buildFromTemplate(template);
      menu.popup({});
    }
  }

  private async startGameWithCloudSaveCheck(game: Game) {
    const latestCloudSave = game.getLatestCloudSave();
    if (latestCloudSave) {
      const shouldSync = await this.dialog.openSyncCloudSaveDialog(game, latestCloudSave);
      if (shouldSync) {
        await this.syncCloudSave(game, latestCloudSave);
      }
    }
    game.startGame();
  }

  private async syncCloudSave(game: Game, save: RemoteSave | Save) {
    try {
      game.rollbackRemoteSave(save);
    } catch (error) {
      console.error('同步云端存档失败:', error);
    }
  }
}

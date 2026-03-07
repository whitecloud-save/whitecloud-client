import {Component, Input, NgZone} from '@angular/core';
import {Game} from '../../../entity/game';
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
import {mainAPI} from '../../../library/api/main-api';

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
      mainAPI.menu.popMenu([{
        label: this.game.name,
        icon: game.iconPath ? {
          path: game.iconPath,
          width: 16,
          height: 16,
        } : undefined,
        id: 'navigate-game',
      }, {
        type: 'separator',
      }, {
        label: '启动游戏',
        id: 'start-game'
      }, {
        label: '从库中移除',
        id: 'remove',
      }], (notify: {id: string}) => {
        switch(notify.id) {
          case 'navigate-game': {
            this.router.navigate(['/main/game/' + this.game.id]);
            break;
          }
          case 'start-game': {
            this.zone.run(async () => {
              await this.startGameWithCloudSaveCheck(game);
            });
            break;
          }
          case 'remove': {
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
            break;
          }
        }
      });
    }

    if (this.game instanceof RemoteGame) {
      const game = this.game;

      mainAPI.menu.popMenu([{
        label: game.name,
        id: 'sync-game'
      }, {
        type: 'separator',
      }, {
        label: '同步到本地',
        id: 'sync-game'
      }, {
        label: '从云端删除',
        id: 'delete-game'
      }], (notify: {id: string}) => {
        switch(notify.id) {
          case 'sync-game': {
            this.zone.run(() => {
              this.dialog.openSyncGameDialog(game);
            });
            break;
          }
          case 'delete-game': {
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
          }
        }
      })
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

import {Component, Input} from '@angular/core';
import {Game, GameState} from '../../../entity/game';
import {IconService} from '../../../service/icon.service';
import {DialogService} from '../../../service/dialog.service';
import {NzModalService} from 'ng-zorro-antd/modal';
import {RemoteSave} from '../../../entity/remote-save';
import {Save} from '../../../entity/save';

@Component({
  selector: 'app-start-game-button',
  templateUrl: './start-game-button.component.html',
  styleUrl: './start-game-button.component.scss',
})
export class StartGameButtonComponent {
  @Input()
  game!: Game;

  GameState = GameState;

  starting = false;

  constructor(
    public iconService: IconService,
    private dialog: DialogService,
    private modal: NzModalService,
  ) {}

  async startGame() {
    this.starting = true;

    const latestCloudSave = this.game.getLatestCloudSave();
    if (latestCloudSave) {
      const shouldSync = await this.dialog.openSyncCloudSaveDialog(this.game, latestCloudSave);
      if (shouldSync) {
        await this.syncCloudSave(this.game, latestCloudSave);
      }
    }

    this.game.startGame();
    this.starting = false;
  }

  private async syncCloudSave(game: Game, save: RemoteSave | Save) {
    try {
      game.rollbackRemoteSave(save);
    } catch (error) {
      console.error('同步云端存档失败:', error);
    }
  }
}

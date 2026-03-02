import {Component} from '@angular/core';
import {IconService} from '../../../../service/icon.service';
import {GameImportService} from '../game-import.service';
import {app, dialog} from '@electron/remote';

@Component({
  selector: 'app-game-detail-form',
  templateUrl: './game-detail-form.component.html',
  styleUrl: './game-detail-form.component.scss',
})
export class GameDetailFormComponent {
  documentPath?: string;
  appDataPath?: string;

  constructor(
    public iconService: IconService,
    public gameImportService: GameImportService,
  ) {
    this.getPath();
  }

  async getPath() {
    this.documentPath = app.getPath('documents');
    this.appDataPath = app.getPath('appData');
  }

  async openSavePathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏存档文件夹',
    });
    if (res.canceled) {
      return;
    }

    this.gameImportService.setSavePath(res.filePaths[0]);
  }
}

import {Component} from '@angular/core';
import {IconService} from '../../../../service/icon.service';
import {GameImportService} from '../game-import.service';
import {App} from '../../../../library/utility';
import {mainAPI} from '../../../../library/api/main-api';

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
    this.documentPath = App.getPath('documents');
    this.appDataPath = App.getPath('appData');
  }

  async openSavePathDialog() {
    const res = await mainAPI.dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏存档文件夹',
    });
    if (res.canceled) {
      return;
    }

    this.gameImportService.setSavePath(res.filePaths[0]);
  }
}

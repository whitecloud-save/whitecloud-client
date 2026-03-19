import {Component} from '@angular/core';
import {IconService} from '../../../../service/icon.service';
import {GameImportService} from '../game-import.service';
import {App} from '../../../../library/utility';
import {mainAPI} from '../../../../library/api/main-api';
import {PathUtil} from 'app/library/path-util';

@Component({
  selector: 'app-game-detail-form',
  templateUrl: './game-detail-form.component.html',
  styleUrl: './game-detail-form.component.scss',
})
export class GameDetailFormComponent {
  // documentPath?: string;
  // appDataPath?: string;

  constructor(
    public iconService: IconService,
    public gameImportService: GameImportService,
  ) {
    // this.getPath();
  }

  // async getPath() {
  //   this.documentPath = App.getPath('documents');
  //   this.appDataPath = App.getPath('appData');
  // }

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

  async openFinderWindow() {
    if (!this.gameImportService.setting.exeFile)
      return;

    const exePath = this.gameImportService.setting.exeFile.startsWith('steam://') ?
      this.gameImportService.setting.exeFile :
      PathUtil.join(this.gameImportService.setting.gamePath as string, this.gameImportService.setting.exeFile as string);

    await mainAPI.window.createSaveFinderWindow({
      gamePath: this.gameImportService.setting.gamePath as string,
      exePath,
    })
  }
}

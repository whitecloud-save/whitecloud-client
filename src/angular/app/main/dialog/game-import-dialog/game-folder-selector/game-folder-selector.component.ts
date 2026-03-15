import {Component, EventEmitter, Output} from '@angular/core';
import {IconService} from '../../../../service/icon.service';
import {mainAPI} from '../../../../library/api/main-api';

declare const window: ElectronWindow;
export interface ElectronWindow {
  electron: {
    getFilePath(file: File): string,
  };
}

@Component({
  selector: 'app-game-folder-selector',
  templateUrl: './game-folder-selector.component.html',
  styleUrl: './game-folder-selector.component.scss',
})
export class GameFolderSelectorComponent {
  @Output() open: EventEmitter<string> = new EventEmitter();

  active = false;

  constructor(
    public iconService: IconService,
  ) {}

  async openFolderSelectorDialog() {
    const res = await mainAPI.dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏文件夹',
    });
    if (res.canceled) {
      return;
    }

    this.open.emit(res.filePaths[0]);
  }

  async onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      const fullPath = window.electron.getFilePath(file);
      this.open.emit(fullPath);
    }
  }
}

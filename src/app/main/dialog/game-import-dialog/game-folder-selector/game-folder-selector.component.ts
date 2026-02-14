import {Component, EventEmitter, Output} from '@angular/core';
import {IconService} from '../../../../service/icon.service';
import {dialog} from '@electron/remote';

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
    const res = await dialog.showOpenDialog({
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
      this.open.emit(file.path);
    }
  }
}

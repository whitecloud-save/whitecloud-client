import {Component} from '@angular/core';
import {faFolder} from '@fortawesome/pro-solid-svg-icons';
import {GameImportService} from './game-import.service';
import {NzModalRef} from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-game-import-dialog',
  templateUrl: './game-import-dialog.component.html',
  styleUrl: './game-import-dialog.component.scss',
  providers: [GameImportService],
})
export class GameImportDialogComponent {
  icons = {
    faFolder,
  };

  constructor(
    public gameImportService: GameImportService,
    public ref: NzModalRef,
  ) {}

  async confirm() {
    await this.gameImportService.confirm();
    this.ref.close();
  }
}

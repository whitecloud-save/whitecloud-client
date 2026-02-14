import {Component, inject} from '@angular/core';
import {NZ_MODAL_DATA, NzModalRef} from 'ng-zorro-antd/modal';
import {RemoteGame} from '../../../entity/remote-game';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IconService} from '../../../service/icon.service';
import {dialog} from '@electron/remote';
import path from 'path';
import {NzMessageService} from 'ng-zorro-antd/message';
import {GameService} from '../../../service/game.service';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';

@Component({
  selector: 'app-sync-remote-game-dialog',
  templateUrl: './sync-remote-game-dialog.component.html',
  styleUrl: './sync-remote-game-dialog.component.scss',
})
export class SyncRemoteGameDialogComponent {

  gameForm: FormGroup<{
    exePath: FormControl<string>;
    savePath: FormControl<string>;
  }>;

  readonly ref = inject(NzModalRef);
  readonly nzModalData: {game: RemoteGame} = inject(NZ_MODAL_DATA);

  constructor(
    public iconService: IconService,
    public message: NzMessageService,
    private gameService: GameService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {
    this.gameForm = new FormGroup({
      exePath: new FormControl('', [Validators.required]) as FormControl<string>,
      savePath: new FormControl(this.nzModalData.game.savePath, [Validators.required]) as FormControl<string>,
    });
  }

  async openGamePathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: `请选择${this.nzModalData.game.exePath}`,
      filters: [{
        name: '可执行文件',
        extensions: ['exe'],
      }],
    });
    if (res.canceled) {
      return;
    }

    if (!res.filePaths[0])
      return;

    const filePath = res.filePaths[0];
    if (path.basename(filePath) !== this.nzModalData.game.exePath) {
      this.message.error('文件名错误，请选择：' + this.nzModalData.game.exePath);
      return;
    }

    this.gameForm.patchValue({
      exePath: filePath,
    });
  }

  async openSavePathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏存档文件夹',
    });
    if (res.canceled) {
      return;
    }

    this.gameForm.patchValue({
      savePath: res.filePaths[0],
    });
  }

  submit() {
    const savePath = this.gameForm.value.savePath;
    if (!savePath)
      return;
    const exePath = this.gameForm.value.exePath;
    if (!exePath)
      return;

    const gamePath = path.dirname(exePath);

    this.gameService.importRemoteGame(this.nzModalData.game, {
      savePath,
      gamePath,
    })
      .then(() => {
        this.ref.close();
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '同步游戏失败');
      });
  }
}

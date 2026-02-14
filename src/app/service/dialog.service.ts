import {Injectable} from '@angular/core';
import {NzModalService} from 'ng-zorro-antd/modal';
import {GameImportDialogComponent} from '../main/dialog/game-import-dialog/game-import-dialog.component';
import {UserLoginRegisterComponent} from '../main/dialog/user-login-register/user-login-register.component';
import {UserModifyNicknameComponent} from '../main/dialog/user-modify-nickname/user-modify-nickname.component';
import {UserForgetPasswordComponent} from '../main/dialog/user-forget-password/user-forget-password.component';
import {Save} from '../entity/save';
import {SaveRemarkEditorComponent} from '../main/dialog/save-remark-editor/save-remark-editor.component';
import {RemoteGame} from '../entity/remote-game';
import {SyncRemoteGameDialogComponent} from '../main/dialog/sync-remote-game-dialog/sync-remote-game-dialog.component';
import {VipBenefitDialogComponent} from '../main/dialog/vip-benefit-dialog/vip-benefit-dialog.component';
import {SyncCloudSaveDialogComponent} from '../main/dialog/sync-cloud-save-dialog/sync-cloud-save-dialog.component';
import {Game} from '../entity/game';
import {RemoteSave} from '../entity/remote-save';
import {FullUpdateDialogComponent} from '../main/dialog/full-update-dialog/full-update-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {

  constructor(
    private modal: NzModalService,
  ) { }

  openCreateGameDialog() {
    this.modal.create({
      nzContent: GameImportDialogComponent,
      nzTitle: '添加一个新游戏',
      nzFooter: null,
      nzClassName: 'top-modal',
      nzMaskClosable: false,
    });
  }

  openUserLoginRegisterDialog(mode: 'login' | 'register') {
    this.modal.create({
      nzContent: UserLoginRegisterComponent,
      nzTitle: '登录',
      nzFooter: null,
      nzClassName: 'top-modal',
      nzData: {
        mode,
      },
    });
  }

  openUserNicknameDialog() {
    this.modal.create({
      nzContent: UserModifyNicknameComponent,
      nzTitle: '修改昵称',
      nzFooter: null,
      nzClassName: 'top-modal',
    });
  }

  openUserForgetPasswordDialog() {
    this.modal.create({
      nzContent: UserForgetPasswordComponent,
      nzTitle: '忘记密码',
      nzFooter: null,
      nzClassName: 'top-modal',
    });
  }

  openSaveRemarkEditorDialog(save: Save) {
    this.modal.create({
      nzContent: SaveRemarkEditorComponent,
      nzTitle: '修改存档名称',
      nzFooter: null,
      nzClassName: 'top-modal',
      nzData: {
        save,
      },
    });
  }

  openSyncGameDialog(game: RemoteGame) {
    this.modal.create({
      nzContent: SyncRemoteGameDialogComponent,
      nzTitle: '同步云端游戏',
      nzFooter: null,
      nzClassName: 'top-modal',
      nzData: {
        game,
      },
    });
  }

  openVipBenefitDialog() {
    return this.modal.create({
      nzContent: VipBenefitDialogComponent,
      nzTitle: '',
      nzFooter: null,
      nzClassName: 'vip-benefit-modal',
      nzMaskClosable: true,
    });
  }

  openSyncCloudSaveDialog(game: Game, remoteSave: RemoteSave | Save): Promise<boolean> {
    return new Promise((resolve) => {
      const modalRef = this.modal.create({
        nzContent: SyncCloudSaveDialogComponent,
        nzTitle: '是否同步云存档',
        nzFooter: null,
        nzClassName: 'top-modal',
        nzMaskClosable: false,
        nzData: {
          game,
          remoteSave,
        },
      });

      modalRef.afterClose.subscribe((result: boolean | undefined) => {
        resolve(result === true);
      });
    });
  }

  openFullUpdateDialog(version: string, force = false) {
    if (!force) {
      const shownVersion = localStorage.getItem('full-update-dialog-shown-version');
      if (shownVersion === version) {
        return;
      }
    }

    this.modal.create({
      nzContent: FullUpdateDialogComponent,
      nzFooter: null,
      nzClassName: 'top-modal',
      nzMaskClosable: false,
      nzData: {
        version,
      },
    });

    localStorage.setItem('full-update-dialog-shown-version', version);
  }
}

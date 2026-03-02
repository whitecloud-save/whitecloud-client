import {Component, ErrorHandler} from '@angular/core';
import {UserService} from '../../../../service/user.service';
import {DialogService} from '../../../../service/dialog.service';
import {dialog} from '@electron/remote';
import fs from 'fs/promises';
import {v4} from 'uuid';
import {OssService} from '../../../../service/oss.service';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrl: './user-setting.component.scss',
})
export class UserSettingComponent {
  uploadingAvatar = false;
  storageUsed = 0;
  storageMax = 0;
  storagePercentage = 0;
  storageRemaining = 0;

  constructor(
    public userService: UserService,
    public dialogService: DialogService,
    public ossService: OssService,
    public errorHandler: ErrorHandler,
  ) {
    this.updateStorageInfo();
  }

  updateStorageInfo() {
    this.userService.logged.subscribe((logged) => {
      if (logged) {
        this.fetchStorageInfo();
      }
    });

    this.userService.storageUpdate.subscribe((notify) => {
      if (notify) {
        this.fetchStorageInfo();
      }
    });
  }

  fetchStorageInfo() {
    this.storageUsed = this.userService.getStorageUsed();
    this.storageMax = this.userService.getStorageMax();
    this.storagePercentage = this.storageMax > 0 ? parseFloat(((this.storageUsed / this.storageMax) * 100).toFixed(2)) : 0;
    this.storageRemaining = this.storageMax - this.storageUsed;
  }

  async changeAvatar() {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '请选择用户头像',
      filters: [
        {name: '图片文件', extensions: ['png', 'jpg']},
      ],
    });

    if (res.canceled) {
      return;
    }

    if (res.filePaths && res.filePaths.length) {
      const filePath = res.filePaths[0];

      const content = await fs.readFile(filePath);
      const file = new File([content as BlobPart], v4());

      this.uploadingAvatar = true;
      try {
        await this.ossService.uploadAvatar(file);
        this.uploadingAvatar = false;
      } catch (err) {
        this.errorHandler.handleError(err);
        this.uploadingAvatar = false;
      }
    }
  }

  openVipBenefit() {
    this.dialogService.openVipBenefitDialog();
  }
}

import {Component, ErrorHandler} from '@angular/core';
import {UserService} from '../../../../service/user.service';
import {DialogService} from '../../../../service/dialog.service';
import {v4} from 'uuid';
import {OssService} from '../../../../service/oss.service';
import {workerAPI} from '../../../../library/api/worker-api';
import {mainAPI} from '../../../../library/api/main-api';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrl: './user-setting.component.scss',
})
export class UserSettingComponent {
  uploadingAvatar = false;
  storageUsed = 0n;
  storageMax = 0n;
  storagePercentage = 0;
  storageRemaining = 0n;

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
    this.storagePercentage = parseInt((this.storageUsed * 10000n / this.storageMax).toString()) / 10000;
    this.storageRemaining = this.storageMax - this.storageUsed;
  }

  async changeAvatar() {
    const res = await mainAPI.dialog.showOpenDialog({
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

      const content = await workerAPI.fs.readFile(filePath);
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

import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {app} from '@electron/remote';
import {SettingService} from '../../../../service/setting.service';
import {UpdateService, UpdateState} from '../../../../service/update.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {ipcRenderer} from 'electron';
import {DialogService} from '../../../../service/dialog.service';

@Component({
  selector: 'app-basic-setting',
  templateUrl: './basic-setting.component.html',
  styleUrl: './basic-setting.component.scss',
})
export class BasicSettingComponent {

  version: string;
  sliderMarks = { 10: '10MB', 50: '50MB', 100: '100MB' };
  UpdateState = UpdateState;

  openWithSystem = new FormControl({value: app.getLoginItemSettings().openAtLogin, disabled: !app.isPackaged});
  globalSaveBackupLimit = new FormControl(100);
  basicForm = new FormGroup({
    openWithSystem: this.openWithSystem,
    globalSaveBackupLimit: this.globalSaveBackupLimit,
  });

  constructor(
    private settingService: SettingService,
    public updateService: UpdateService,
    private message: NzMessageService,
    private modal: NzModalService,
    private dialogService: DialogService,
  ) {
    this.openWithSystem.valueChanges.subscribe((value) => {
      if (value === null)
        return;
      app.setLoginItemSettings({
        openAtLogin: value,
      });
    });

    this.globalSaveBackupLimit.setValue(this.settingService.globalSaveBackupLimit);
    this.globalSaveBackupLimit.valueChanges.subscribe((value) => {
      if (value === null)
        return;
      this.settingService.globalSaveBackupLimit = value;
      this.settingService.save();
    });

    this.version = app.getVersion();
  }

  async checkForUpdates() {
    try {
      const updateInfo = await this.updateService.checkForUpdates();
      if (!updateInfo) {
        this.message.info('当前已是最新版本');
        return;
      }
      if (updateInfo.hasFullUpdate && updateInfo.fullUpdateVersion) {
        this.dialogService.openFullUpdateDialog(updateInfo.fullUpdateVersion, true);
        return;
      }
      if (updateInfo.latestVersion) {
        this.message.info(`发现新版本 ${updateInfo.latestVersion.version}，正在后台下载...`);
        this.updateService.downloadUpdate(updateInfo.latestVersion);
      }
    } catch (error) {
      this.message.error('检查更新失败');
      console.error('检查更新失败:', error);
    }
  }

  confirmInstallUpdate() {
    this.modal.confirm({
      nzTitle: '安装更新',
      nzContent: '更新已准备就绪，是否立即重启软件以安装更新？',
      nzOkText: '立即重启',
      nzCancelText: '稍后',
      nzOnOk: () => {
        ipcRenderer.invoke('quit-and-install');
      },
    });
  }
}

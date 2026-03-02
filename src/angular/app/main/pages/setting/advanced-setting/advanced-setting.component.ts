import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {SettingService} from '../../../../service/setting.service';
import {IconService} from '../../../../service/icon.service';
import {dialog} from '@electron/remote';
import {GameValidators} from '../../../../library/utility';

@Component({
  selector: 'app-advanced-setting',
  templateUrl: './advanced-setting.component.html',
  styleUrl: './advanced-setting.component.scss',
})
export class AdvancedSettingComponent {
  LEProfileSelections: {label: string; value: string}[] = [];

  basicForm: FormGroup<{
    useLE: FormControl<boolean | null>;
    LEExePath: FormControl<string | null>;
  }>;

  constructor(
    public settingService: SettingService,
    public iconService: IconService,
  ) {
    this.basicForm = new FormGroup({
      useLE: new FormControl(settingService.useLE),
      LEExePath: new FormControl({
        value: settingService.LEExePath,
        disabled: !settingService.useLE,
      }, {validators: [GameValidators.file]}),
    });

    this.basicForm.controls.useLE.valueChanges.subscribe((value) => {
      if (value === null)
        return;

      this.settingService.useLE = value;
      this.settingService.save();
      if (value) {
        this.basicForm.controls.LEExePath.enable();
      } else {
        this.basicForm.controls.LEExePath.disable();
      }
    });

    this.basicForm.controls.LEExePath.valueChanges.subscribe(async (value) => {
      if (value === null)
        return;
      this.settingService.LEExePath = value;
      this.settingService.save();
      this.settingService.updateLEProfile();
    });
  }

  async openLEExePathPathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '请选择LEProc.exe',
      filters: [{
        name: '可执行文件',
        extensions: ['exe'],
      }],
    });
    if (res.canceled) {
      return;
    }
    this.basicForm.patchValue({
      LEExePath: res.filePaths[0],
    });

  }
}

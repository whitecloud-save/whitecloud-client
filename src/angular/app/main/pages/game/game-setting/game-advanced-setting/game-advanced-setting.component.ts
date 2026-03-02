import {Component, Input, OnInit} from '@angular/core';
import {Game} from '../../../../../entity/game';
import {FormControl, FormGroup} from '@angular/forms';
import {SettingService} from '../../../../../service/setting.service';

@Component({
  selector: 'app-game-advanced-setting',
  templateUrl: './game-advanced-setting.component.html',
  styleUrl: './game-advanced-setting.component.scss',
})
export class GameAdvancedSettingComponent implements OnInit {
  @Input()
  game!: Game;

  get LETooltips() {
    if (!this.settingService.useLE)
      return '使用Locale Emulator选项已关闭，可前往【设置-高级设置-使用Locale Emulator】中打开';

    if (!this.settingService.LEExePath)
      return '未设置LEProc.exe，请前往【设置-高级设置-LEProc.exe】中进行设置';
    return '';

  }

  basicForm!: FormGroup<{
    LEProfile: FormControl<string | null>;
  }>;

  constructor(
    public settingService: SettingService
  ) {
    this.settingService.updateLEProfile();
  }

  ngOnInit() {
    this.basicForm = new FormGroup({
      LEProfile: new FormControl({
        value: this.settingService.LEAvailable ? this.game.extractSetting.LEProfile || '' : '',
        disabled: !this.settingService.LEAvailable,
      }),
    });

    this.basicForm.controls.LEProfile.valueChanges.subscribe(async (value) => {
      if (value === null)
        return;
      this.game.extractSetting.LEProfile = value;
      await this.game.save(false);
    });
  }
}

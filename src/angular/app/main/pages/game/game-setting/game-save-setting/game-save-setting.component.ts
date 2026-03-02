import {Component, Input, OnInit} from '@angular/core';
import {Game} from '../../../../../entity/game';
import {RemoteSave} from '../../../../../entity/remote-save';
import {FormControl, FormGroup} from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import {IconService} from '../../../../../service/icon.service';
import {UserService} from '../../../../../service/user.service';
import {SaveState} from '../../../../../entity/save';
import {SettingService} from '../../../../../service/setting.service';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {GameService} from '../../../../../service/game.service';
import {ErrorHandlingUtil} from '../../../../../service/error-handling-util';

@Component({
  selector: 'app-game-save-setting',
  templateUrl: './game-save-setting.component.html',
  styleUrl: './game-save-setting.component.scss',
})
export class GameSaveSettingComponent implements OnInit {
  @Input()
  game!: Game;

  saveForm!: FormGroup<{localSaveNum: FormControl<number | null>; autoClearLocalSave: FormControl<boolean | null>; useCustomSaveBackupLimit: FormControl<boolean | null>; saveBackupLimit: FormControl<number | null>}>;
  serverForm!: FormGroup<{enableCloudSave: FormControl<boolean | null>; cloudSaveNum: FormControl<number | null>}>;

  constructor(
    public iconService: IconService,
    public userService: UserService,
    public settingService: SettingService,
    private modal: NzModalService,
    private message: NzMessageService,
    private gameService: GameService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {}

  ngOnInit() {
    this.saveForm = new FormGroup({
      autoClearLocalSave: new FormControl(!!this.game.localSaveNum),
      localSaveNum: new FormControl({value: this.game.localSaveNum, disabled: !this.game.localSaveNum}),
      useCustomSaveBackupLimit: new FormControl(this.game.useCustomSaveBackupLimit),
      saveBackupLimit: new FormControl({value: this.game.saveBackupLimit, disabled: !this.game.useCustomSaveBackupLimit}),
    });

    this.saveForm.controls.autoClearLocalSave.valueChanges.subscribe((value) => {
      if (value) {
        this.saveForm.patchValue({
          localSaveNum: 20,
        });
        this.saveForm.controls.localSaveNum.enable();
      } else {
        this.saveForm.patchValue({
          localSaveNum: 0,
        });
        this.saveForm.controls.localSaveNum.disable();
      }
    });

    this.saveForm.controls.useCustomSaveBackupLimit.valueChanges.subscribe((value) => {
      if (value) {
        this.saveForm.controls.saveBackupLimit.enable();
      } else {
        this.saveForm.controls.saveBackupLimit.disable();
      }
    });

    this.saveForm.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(async (value) => {
      this.game.localSaveNum = value.localSaveNum as number;
      this.game.useCustomSaveBackupLimit = value.useCustomSaveBackupLimit as boolean;
      this.game.saveBackupLimit = value.saveBackupLimit as number;
      await this.game.save();
    });

    this.serverForm = new FormGroup({
      enableCloudSave: new FormControl(this.game.enableCloudSave ?? true),
      cloudSaveNum: new FormControl({value: this.game.cloudSaveNum, disabled: !this.game.enableCloudSave}),
    });

    this.serverForm.controls.enableCloudSave.valueChanges.subscribe((value) => {
      console.log(value);
      if (value) {
        this.serverForm.controls.cloudSaveNum.enable();
      } else {
        this.serverForm.controls.cloudSaveNum.disable();
      }
    })

    this.serverForm.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(async (value) => {
      console.log('game save');
      this.game.enableCloudSave = value.enableCloudSave as boolean;
      this.game.cloudSaveNum = value.cloudSaveNum as number;
      await this.game.save();
    });
  }

  get cloudSaveSize(): number {
    return this.game.saves
      .filter((save) => save.ossPath)
      .reduce((total, save) => total + (save.size || 0), 0);
  }

  clearCloudSaves() {
    this.modal.confirm({
      nzTitle: '清空游戏云存档',
      nzContent: '确认清空该游戏的所有云存档？该操作无法恢复',
      nzOkText: '确认',
      nzOkDanger: true,
      nzOnOk: () => {
        this.gameService.clearGameSaves(this.game.id)
          .then(() => {
            this.message.success('清空成功');
          })
          .catch((err) => {
            this.errorHandlingUtil.handleManualError(err, '清空云存档失败');
          });
      },
    });
  }
}

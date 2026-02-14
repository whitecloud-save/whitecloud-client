import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {IconService} from '../../../../../service/icon.service';
import {GamePageService} from '../../game-page.service';
import {Game} from '../../../../../entity/game';
import {dialog} from '@electron/remote';
import fs from 'fs/promises';
import path from 'path';
import {GameUtil, GameValidators} from '../../../../../library/utility';

@Component({
  selector: 'app-game-basic-setting',
  templateUrl: './game-basic-setting.component.html',
  styleUrl: './game-basic-setting.component.scss',
})
export class GameBasicSettingComponent implements OnInit {
  @Input()
  game!: Game;

  basicForm!: FormGroup<{
    name: FormControl<string | null>;
    savePath: FormControl<string | null>;
    gamePath: FormControl<string | null>;
    exeFile: FormControl<string | null>;
    coverImgUrl: FormControl<string | null>;
    autoOpenGuide: FormControl<boolean | null>;
  }>;
  exeSelections: string[];
  preGamePath: string;

  constructor(
    private fb: FormBuilder,
    public iconService: IconService,
    public gamePageService: GamePageService,
  ) {
    this.exeSelections = [];
    this.preGamePath = '';
  }

  async ngOnInit() {
    this.preGamePath = this.game.gamePath;

    this.basicForm = new FormGroup({
      name: new FormControl(this.game.name, {validators: [Validators.required], updateOn: 'blur'}),
      savePath: new FormControl(this.game.savePath, {validators: [Validators.required, GameValidators.folder], updateOn: 'blur'}),
      gamePath: new FormControl(this.game.gamePath, {validators: [Validators.required, GameValidators.folder], updateOn: 'blur'}),
      exeFile: new FormControl(this.game.exeFile, {validators: [Validators.required]}),
      coverImgUrl: new FormControl(this.game.coverImgUrl, {validators: [Validators.required]}),
      autoOpenGuide: new FormControl(this.game.autoOpenGuide),
    }, {
      validators: [],
    });

    this.basicForm.markAllAsTouched();

    await this.updateExePathSelection(this.game.gamePath);

    this.basicForm.valueChanges.subscribe(async (value) => {
      if (value.gamePath !== this.preGamePath && value.gamePath) {
        await this.updateExePathSelection(value.gamePath);
        this.basicForm.patchValue({
          exeFile: '',
        });
        this.preGamePath = value.gamePath;
      }
      if (!value.name)
        return;

      this.game.name = value.name;
      if (value.savePath && value.gamePath) {
        this.game.savePath = GameUtil.encodePath(value.savePath, value.gamePath);
      }
      if (value.gamePath) {
        this.game.gamePath = value.gamePath;
      }
      if (value.exeFile) {
        this.game.exeFile = value.exeFile;
      }
      if (value.autoOpenGuide !== null && value.autoOpenGuide !== undefined) {
        this.game.autoOpenGuide = value.autoOpenGuide;
      }
      if (value.coverImgUrl && this.game.coverImgUrl !== value.coverImgUrl) {
        this.game.coverImgUrl = value.coverImgUrl;
      }

      await this.game.save();
      await this.game.checkState();
    });
  }

  async updateExePathSelection(dirPath: string) {
    this.exeSelections = [];
    try {
      await fs.access(dirPath);
    } catch (err) {
      return;
    }
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (path.extname(file) !== '.exe')
        continue;

      const stat = await fs.lstat(path.join(dirPath, file));
      if (stat.isFile()) {
        this.exeSelections.push(file);
      }
    }
  }

  async openSavePathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择存档文件夹',
    });
    if (res.canceled) {
      return;
    }
    this.basicForm.patchValue({
      savePath: res.filePaths[0],
    });
  }

  async openGamePathDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏文件夹',
    });
    if (res.canceled) {
      return;
    }
    this.basicForm.patchValue({
      gamePath: res.filePaths[0],
    });
  }
}

import {Injectable} from '@angular/core';
import {BaseError} from '../../../library/error/BaseError';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {GameService, IImportGameParams} from '../../../service/game.service';
import fs from 'fs/promises';
import path from 'path';

export enum GameImportStep {
  SelectGameDir = 1,
  SetGameExePath = 2,
  DetailSetting = 3,
  CoverSetting = 4,
}

export interface IImportGameSetting {
  gamePath?: string;
  exeFile?: string;
}

@Injectable({
  providedIn: null,
})
export class GameImportService {
  GameImportStep = GameImportStep;
  step = GameImportStep.SelectGameDir;
  setting: IImportGameSetting = {};
  exeSelections: string[] = [];
  error?: Error;

  detailForm: UntypedFormGroup;
  coverForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private gameService: GameService,
  ) {
    this.detailForm = this.fb.group({
      name: [null, [Validators.required]],
      savePath: [null, [Validators.required]],
    });
    this.coverForm = this.fb.group({
      coverImageUrl: [null, [Validators.required]],
    });
  }

  async selectGamePath(dirPath: string) {
    this.setting.gamePath = dirPath;
    const files = await fs.readdir(dirPath);
    this.exeSelections = [];

    for (const file of files) {
      if (path.extname(file) !== '.exe')
        continue;

      const stat = await fs.lstat(path.join(dirPath, file));
      if (stat.isFile()) {
        this.exeSelections.push(file);
      }
    }

    for (const file of files) {
      const dir = path.join(dirPath, file);
      const stat = await fs.lstat(dir);
      if (stat.isDirectory() && file.toLowerCase().includes('save')) {
        this.detailForm.patchValue({
          savePath: dir,
        });
      }
    }

    this.detailForm.patchValue({
      name: path.basename(this.setting.gamePath),
    });
    if (!this.exeSelections.length) {
      this.error = new BaseError('ERR_GAME_EXE_NOT_FOUND', 'ERR_GAME_EXE_NOT_FOUND');
    } else {
      this.step = GameImportStep.SetGameExePath;
      this.setting.exeFile = this.exeSelections.find(selection => selection.indexOf('chs') >= 0) || this.exeSelections[0];
    }
  }

  async setSavePath(dirPath: string) {
    this.detailForm.patchValue({
      savePath: dirPath,
    });
  }

  jump(step: GameImportStep) {
    this.step = step;
  }

  next() {
    this.step += 1;
  }

  pre() {
    this.step -=1;
  }

  get data() {
    const value: {name: string; savePath: string} = this.detailForm.value;
    return {
      ...this.setting,
      ...value,
    };
  }

  async confirm() {
    const detail: {name: string; savePath: string} = this.detailForm.value;
    const cover: {coverImageUrl: string} = this.coverForm.value;

    this.gameService.importGame({
      ...this.setting,
      ...detail,
      coverImgUrl: cover.coverImageUrl,
    } as IImportGameParams);
  }
}

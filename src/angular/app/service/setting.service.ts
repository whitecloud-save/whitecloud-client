import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {PathUtil} from '../library/path-util';
import {workerAPI} from '../library/api/worker-api';
import {BaseError} from 'app/library/error/BaseError';
import {ErrorCode} from 'app/library/error/ErrorCode';
import {ErrorString} from 'app/library/error/ErrorString';

@Injectable({
  providedIn: 'root',
})
export class SettingService {

  public useLE: boolean;
  public LEExePath: string;
  public LEError?: Error;

  public LEProfileSelections: BehaviorSubject<{label: string; value: string}[]>;

  get LEAvailable() {
    return this.useLE && this.LEExePath && !this.LEError;
  }

  get LEErrorString() {
    if (!this.LEError)
      return '';
    if (this.LEError instanceof BaseError) {
      return ErrorString[this.LEError.code] as string || this.LEError.message;
    }

    return this.LEError.message;
  }

  constructor() {
    this.useLE = false;
    this.LEExePath = '';

    this.LEProfileSelections = new BehaviorSubject([] as {label: string; value: string}[]);
  }

  async load() {
    const setting = JSON.parse(localStorage.getItem('app:setting') || '{}');
    this.useLE = setting.useLE || false;
    this.LEExePath = setting.LEExePath || '';
    await this.updateLEProfile();
  }

  save() {
    localStorage.setItem('app:setting', JSON.stringify({
      useLE: this.useLE,
      LEExePath: this.LEExePath,
    }));

    this.updateLEProfile();
  }

  async updateLEProfile() {
    if (this.useLE && this.LEExePath) {
      try {
        const exeExisted = await workerAPI.fs.exists(this.LEExePath);
        if (!exeExisted)
          throw new BaseError(ErrorCode.ERR_LE_EXE_NOT_FOUND);

        const configPath = PathUtil.join(PathUtil.dirname(this.LEExePath), 'LEConfig.xml');
        const configExisted = await workerAPI.fs.exists(configPath);
        if (!configExisted)
          throw new BaseError(ErrorCode.ERR_LE_PROFILE_NOT_FOUND);

        const parsed = await workerAPI.fs.readXML(configPath);
        const configList = parsed.LEConfig.Profiles[0].Profile.map((p: any) => ({label: p.$.Name, value: p.$.Guid}));
        this.LEProfileSelections.next(configList);

        this.LEError = undefined;
      } catch (err) {
        this.LEError = err as Error;
      }
    } else {
      this.LEError = undefined;
    }
  }
}

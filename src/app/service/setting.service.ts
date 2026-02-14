import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import fs from 'fs/promises';
import path from 'path';
import xml2js from 'xml2js';

@Injectable({
  providedIn: 'root',
})
export class SettingService {

  public useLE: boolean;
  public LEExePath: string;
  public globalSaveBackupLimit: number;

  public LEProfileSelections: BehaviorSubject<{label: string; value: string}[]>;

  get LEAvailable() {
    return this.useLE && this.LEExePath;
  }

  constructor() {
    this.useLE = false;
    this.LEExePath = '';
    this.globalSaveBackupLimit = 100;

    this.LEProfileSelections = new BehaviorSubject([] as {label: string; value: string}[]);
  }

  async load() {
    const setting = JSON.parse(localStorage.getItem('app:setting') || '{}');
    this.useLE = setting.useLE || false;
    this.LEExePath = setting.LEExePath || '';
    this.globalSaveBackupLimit = setting.globalSaveBackupLimit ?? 100;
    await this.updateLEProfile();
  }

  save() {
    localStorage.setItem('app:setting', JSON.stringify({
      useLE: this.useLE,
      LEExePath: this.LEExePath,
      globalSaveBackupLimit: this.globalSaveBackupLimit,
    }));
  }

  async updateLEProfile() {
    if (this.useLE && this.LEExePath) {
      const xml = await fs.readFile(path.join(path.dirname(this.LEExePath), 'LEConfig.xml'));
      const parser = new xml2js.Parser();
      const profile = await parser.parseStringPromise(xml);

      const configList = profile.LEConfig.Profiles[0].Profile.map((p: any) => ({label: p.$.Name, value: p.$.Guid}));
      this.LEProfileSelections.next(configList);
    }
  }
}

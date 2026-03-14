import {Observable} from 'rxjs';
import {PathUtil} from './path-util';
import {AbstractControl, ValidationErrors} from '@angular/forms';
import sha1 from 'crypto-js/sha1';
import sha256 from 'crypto-js/sha256';
import {workerAPI} from './api/worker-api';

export enum GamePathMark {
  GameRoot = '$GAME_ROOT',
  AppPath = '$APP_PATH',
  UserData = '$USER_DATA',
}

export interface ISystemPathSetting {
  appData: string,
  userData: string,
  documents: string,
  cwd: string;
}

export class App {
  static init(systemPath: ISystemPathSetting, hostname: string) {
    this.systemPath_ = systemPath;
    this.hostname_ = hostname;
  }

  static getPath(p: 'appData' | 'userData' | 'documents') {
    switch(p) {
      case 'appData':
        return this.systemPath_.appData;
      case 'userData':
        return this.systemPath_.userData;
      case 'documents':
        return this.systemPath_.documents;
    }
  }

  static cwd() {
    return this.systemPath_.cwd;
  }

  static hostname() {
    return this.hostname_;
  }

  private static systemPath_: ISystemPathSetting;
  private static hostname_: string;
}

export class GameUtil {
  static encodePath(dirPath: string, rootPath: string) {
    if (dirPath.startsWith('$'))
      return dirPath;

    if (dirPath.indexOf(rootPath) === 0) {
      return dirPath.replace(rootPath, GamePathMark.GameRoot);
    }

    if (dirPath.indexOf(App.getPath('appData')) === 0) {
      return dirPath.replace(App.getPath('appData'), GamePathMark.AppPath);
    }

    if (dirPath.indexOf(App.getPath('userData')) === 0) {
      return dirPath.replace(App.getPath('userData'), GamePathMark.UserData);
    }

    return dirPath;
  }

  static decodePath(dirPath: string, rootPath: string) {
    if (PathUtil.isAbsolute(dirPath))
      return dirPath;

    if (dirPath.indexOf(GamePathMark.GameRoot) === 0) {
      return dirPath.replace(GamePathMark.GameRoot, rootPath);
    }

    if (dirPath.indexOf(GamePathMark.AppPath) === 0) {
      return dirPath.replace(GamePathMark.AppPath, App.getPath('appData'));
    }

    if (dirPath.indexOf(GamePathMark.UserData) === 0) {
      return dirPath.replace(GamePathMark.UserData, App.getPath('userData'));
    }
    return dirPath;
  }
}

type NonUndefined<T> = T extends undefined ? never : T;

class Utility {
  static null() {}

  static resizeObservable(elem: Element) {
    return new Observable(subscriber => {
      const ro = new ResizeObserver(entries => {
        console.log('resize');
        subscriber.next(entries);
      });

      ro.observe(elem);
      return () => {
        ro.unobserve(elem);
      };
    });
  }

  static arrayDiff<T>(pre: T[], now: T[]) {
    const newEle = now.filter(v => !pre.includes(v));
    const delEle = pre.filter(v => !now.includes(v));
    return {
      new: newEle,
      del: delEle,
    };
  }

  static hideKeys<T extends { [key: string] : unknown }>(obj: T, keys: (keyof T)[]) {
    const result: Partial<T> = {};
    Object.entries(obj).forEach(([key, value]: [keyof T, unknown]) => {
      if (!keys.includes(key))
        result[key] = value as T[keyof T];
    });
    return result;
  }

  static isMeaningful<T>(object: T): object is NonUndefined<T> {
    if (typeof object === 'number')
      return !isNaN(object);
    return !this.isUndefined(object);
  }

  static isUndefined(object: any): object is undefined {
    return object === undefined;
  }

  static mapToJSON(map: Map<string, unknown>) {
    const result: Record<string, unknown> = {};

    for (const key of map.keys()) {
      result[key] = map.get(key);
    }

    return result as {[k: string]: unknown};
  }

  static parseInt(value: string) {
    return Number.parseInt(value, 10) || 0;
  }

  static randomInt(begin: number, end: number) {
    if (begin >= end)
      return begin;

    return Math.floor(begin + (end - begin) * Math.random());
  }

  static randomOne<T>(array: T[]) {
    const index = this.randomInt(0, array.length);
    return array[index];
  }

  static randomOneByWeight<T>(array: T[], weighter: (ele: T) => number) {
    const weightList = array.map((ele) => weighter(ele));
    const totalWeight = weightList.reduce((pre, ele) => pre + ele, 0);
    const resultWeight = this.randomInt(0, totalWeight);
    let currentWeight = 0;
    for (const [idx, ele] of array.entries()) {
      currentWeight += weightList[idx];
      if (currentWeight > resultWeight) {
        return ele;
      }
    }
    return null;
  }

  static deepCopy<T extends Object>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  static stringHash(str: string) {
    return sha1(str).toString().slice(0, 10);
  }

  static passwordHash(password: string) {
    return sha256(password).toString();
  }

  static async calculateDirectoryHash(dirPath: string): Promise<string> {
    return workerAPI.crypto.calculateDirectoryHash(dirPath);
  }

  static async calculateDirectorySize(dirPath: string): Promise<number> {
    return workerAPI.crypto.calculateDirectorySize(dirPath);
  }

  static async calculateFileHash(filePath: string): Promise<string> {
    return workerAPI.crypto.calculateFileHash(filePath);
  }
}

class UnixTime {
  static fromNodeTime(ms: number) {
    return Math.floor(ms / 1000);
  }

  static fromDate(date: Date) {
    return Math.floor(date.getTime() / 1000);
  }

  static now() {
    return this.fromDate(new Date());
  }

  static day(days: number) {
    return days * this.hour(24);
  }

  static hour(hours: number) {
    return hours * this.minute(60);
  }

  static minute(minutes: number) {
    return minutes * this.second(60);
  }

  static second(seconds: number) {
    return seconds;
  }
}

class NodeTime {
  static fromUnixTime(second: number) {
    return second * 1000;
  }

  static fromDate(date: Date) {
    return date.getTime();
  }

  static now() {
    return new Date().getTime();
  }

  static day(days: number) {
    return days * this.hour(24);// 60 * 60 * 24 * days * 1000;
  }

  static hour(hours: number) {
    return hours * this.minute(60);
  }

  static minute(minutes: number) {
    return minutes * this.second(60);
  }

  static second(seconds: number) {
    return seconds * 1000;
  }
}

class GameValidators {
  static async folder(control: AbstractControl) {
    const value = control.value;
    if (!value) {
      return null;
    }

    try {
      const stat = await workerAPI.fs.stat(value); // oFS.statSync(value);
      if (stat.isDirectory)
        return null;
      return {
        folder: true,
      };
    } catch (err) {
      return {
        folder: true,
      };
    }
  }

  static async file(control: AbstractControl) {
    const value = control.value;
    if (!value) {
      return null;
    }

    try {
      const stat = await workerAPI.fs.stat(value);
      if (stat.isFile)
        return null;
      return {
        folder: true,
      };
    } catch (err) {
      return {
        folder: true,
      };
    }
  }
}

class ArrayMap<K, T> extends Map<K, T[]> {
  constructor() {
    super();
  }

  append(k: K, value: T) {
    let pre = this.get(k);
    if (!pre) {
      pre = [];
      this.set(k, pre);
    }
    pre.push(value);
  }

  sureGet(k: K) {
    return this.get(k) || [] as T[];
  }

  remove(k: K, value: T) {
    const pre = this.get(k);
    if (!pre)
      return;
    const index = pre.indexOf(value);
    if (index >= 0) {
      pre.splice(index, 1);
    }
  }
}

export {Utility, NodeTime, UnixTime, ArrayMap, GameValidators};

import {createHash} from 'crypto';
import {app} from '@electron/remote';
import path from 'path';
import fs from 'fs/promises';
import oFS from 'fs';
import {Observable} from 'rxjs';
import {AbstractControl, ValidationErrors} from '@angular/forms';

export enum GamePathMark {
  GameRoot = '$GAME_ROOT',
  AppPath = '$APP_PATH',
  UserData = '$USER_DATA',
}

export class GameUtil {
  static encodePath(dirPath: string, rootPath: string) {
    if (dirPath.startsWith('$'))
      return dirPath;

    if (dirPath.indexOf(rootPath) === 0) {
      return dirPath.replace(rootPath, GamePathMark.GameRoot);
    }

    if (dirPath.indexOf(app.getPath('appData')) === 0) {
      return dirPath.replace(app.getPath('appData'), GamePathMark.AppPath);
    }

    if (dirPath.indexOf(app.getPath('userData')) === 0) {
      return dirPath.replace(app.getPath('userData'), GamePathMark.UserData);
    }

    return dirPath;
  }

  static decodePath(dirPath: string, rootPath: string) {
    if (path.isAbsolute(dirPath))
      return dirPath;

    if (dirPath.indexOf(GamePathMark.GameRoot) === 0) {
      return dirPath.replace(GamePathMark.GameRoot, rootPath);
    }

    if (dirPath.indexOf(GamePathMark.AppPath) === 0) {
      return dirPath.replace(GamePathMark.AppPath, app.getPath('appData'));
    }

    if (dirPath.indexOf(GamePathMark.UserData) === 0) {
      return dirPath.replace(GamePathMark.UserData, app.getPath('userData'));
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
    const hash = createHash('sha1');
    hash.update(str);
    return hash.digest('hex').slice(0, 10);
  }

  static passwordHash(password: string) {
    const hash = createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }

  static async readdir(filePath: string, prefix = '') {
    const result: string[] = [];
    const files = await fs.readdir(filePath);
    for (const file of files) {
      const stat = await fs.stat(path.join(filePath, file));
      if (stat.isDirectory()) {
        const folderResult = await this.readdir(path.posix.join(filePath, file), path.posix.join(prefix, file));
        for (const r of folderResult) {
          result.push(r);
        }
      } else {
        result.push(path.posix.join(prefix, file));
      }
    }

    return result;
  }

  static async calculateDirectoryHash(dirPath: string): Promise<string> {
    const files = await this.readdir(dirPath);
    files.sort();
    const hash = createHash('sha1');
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath);
      hash.update(file);
      hash.update(content);
    }
    return hash.digest('hex').slice(0, 10);
  }

  static async calculateDirectorySize(dirPath: string): Promise<number> {
    const files = await this.readdir(dirPath);
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;
    }
    return totalSize;
  }

  static async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    const hash = createHash('sha1');
    hash.update(content);
    return hash.digest('hex').slice(0, 10);
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
  static folder(control: AbstractControl) : ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    try {
      const stat = oFS.statSync(value);
      if (stat.isDirectory())
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

  static file(control: AbstractControl) : ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    try {
      const stat = oFS.statSync(value);
      if (stat.isFile())
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

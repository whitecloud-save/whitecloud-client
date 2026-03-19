import {Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import VDF from 'vdf-parser';

// 顶层 Root 接口
export interface SteamAppManifest {
  AppState: AppState;
}

// 核心的 AppState 接口
export interface AppState {
  appid: string;
  universe: string;
  LauncherPath: string;
  name: string;
  StateFlags: string;
  installdir: string;
  LastUpdated: string; // Unix 时间戳，解析后为 string
  LastPlayed: string;  // Unix 时间戳，解析后为 string
  SizeOnDisk: string;
  StagingSize: string;
  buildid: string;
  LastOwner: string;   // SteamID64
  DownloadType: string;
  UpdateResult: string;
  BytesToDownload: string;
  BytesDownloaded: string;
  BytesToStage: string;
  BytesStaged: string;
  TargetBuildID: string;
  AutoUpdateBehavior: string;
  AllowOtherDownloadsWhileRunning: string;
  ScheduledAutoUpdate: string;
  InstalledDepots: InstalledDepots;
  UserConfig: SteamConfig;
  MountedConfig: SteamConfig;

  // 预留扩展字段，防止 Steam 未来新增字段导致 TS 报错
  [key: string]: any;
}

// InstalledDepots 包含动态的键（Depot ID），所以使用 Record 或索引签名
export interface InstalledDepots {
  [depotId: string]: DepotInfo;
}

export interface DepotInfo {
  manifest: string;
  size: string;
}

// UserConfig 和 MountedConfig 结构相似，通常包含语言等配置
export interface SteamConfig {
  language: string;
  // 可能还会包含其他配置项，使用索引签名兜底
  [key: string]: string;
}

export class FsHandler extends Route {
  @Route.method
  async readFile(filePath: string): Promise<Uint8Array> {
    return fs.promises.readFile(filePath);
  }

  @Route.method
  async realpath(filePath: string) {
    return fs.promises.realpath(filePath);
  }

  @Route.method
  async writeFile(args: { path: string; data: Uint8Array | string }): Promise<void> {
    await fs.promises.writeFile(args.path, args.data);
  }

  @Route.method
  async deleteFile(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath);
  }

  @Route.method
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  @Route.method
  async readdir(dirPath: string): Promise<string[]> {
    return await fs.promises.readdir(dirPath);
  }

  @Route.method
  async readdirRecursive(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isDirectory()) {
        const folderResult = await this.readdirRecursive(filePath);
        result.push(...folderResult.map(f => path.join(file, f)));
      } else {
        result.push(file);
      }
    }

    return result;
  }

  @Route.method
  async mkdir(args: { path: string; options?: { recursive?: boolean } }): Promise<void> {
    await fs.promises.mkdir(args.path, args.options);
  }

  @Route.method
  async deleteDir(args: { path: string; options?: { recursive?: boolean } }): Promise<void> {
    if (args.options?.recursive) {
      await fs.promises.rm(args.path, { recursive: true, force: true });
    } else {
      await fs.promises.rmdir(args.path);
    }
  }

  @Route.method
  async stat(filePath: string) {
    const stats = await fs.promises.stat(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  }

  @Route.method
  async lstat(filePath: string) {
    const stats = await fs.promises.lstat(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  }

  @Route.method
  async readXML(filePath: string) {
    const xml = await fs.promises.readFile(filePath);
    const parser = new xml2js.Parser();
    const parsed = await parser.parseStringPromise(xml);
    return parsed;
  }

  @Route.method
  async findSteamAcf(req: {steamRoot: string, name: string}) {
    const files = await fs.promises.readdir(req.steamRoot);

    const regex = /^appmanifest_(\d+)\.acf$/i;
    for (const file of files) {
      if (!file.match(regex)) {
        continue;
      }

      const content = await fs.promises.readFile(path.join(req.steamRoot, file));

      const parsed = VDF.parse(content.toString()) as SteamAppManifest;
      if (parsed.AppState.installdir === req.name) {
        return parsed;
      }
    }

    return null;
  }
}

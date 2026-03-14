import {Route} from '@sora-soft/framework';
import fs from 'fs/promises';
import path from 'path';
import xml2js from 'xml2js';

export interface FileStats {
  isFile(): boolean;
  isDirectory(): boolean;
  size: number;
  mtime: Date;
  ctime: Date;
}

export class FsHandler extends Route {
  @Route.method
  async readFile(filePath: string): Promise<Uint8Array> {
    return fs.readFile(filePath);
  }

  @Route.method
  async writeFile(args: { path: string; data: Uint8Array | string }): Promise<void> {
    await fs.writeFile(args.path, args.data);
  }

  @Route.method
  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  @Route.method
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  @Route.method
  async readdir(dirPath: string): Promise<string[]> {
    return await fs.readdir(dirPath);
  }

  @Route.method
  async readdirRecursive(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

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
    await fs.mkdir(args.path, args.options);
  }

  @Route.method
  async deleteDir(args: { path: string; options?: { recursive?: boolean } }): Promise<void> {
    if (args.options?.recursive) {
      await fs.rm(args.path, { recursive: true, force: true });
    } else {
      await fs.rmdir(args.path);
    }
  }

  @Route.method
  async stat(filePath: string) {
    const stats = await fs.stat(filePath);
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
    const stats = await fs.lstat(filePath);
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
    const xml = await fs.readFile(filePath);
    // const xml = await workerAPI.fs.readFile(PathUtil.join(PathUtil.dirname(this.LEExePath), 'LEConfig.xml'));
      const parser = new xml2js.Parser();
      const parsed = await parser.parseStringPromise(xml);
      return parsed;
      try {

        // const configList = profile.LEConfig.Profiles[0].Profile.map((p: any) => ({label: p.$.Name, value: p.$.Guid}));
        // return configl
        // this.LEProfileSelections.next(configList);
      } catch (err) {
        console.log(err);
      }
  }
}

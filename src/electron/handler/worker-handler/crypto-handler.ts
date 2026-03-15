import {Route} from '@sora-soft/framework';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {pipeline} from 'stream/promises';

export class CryptoHandler extends Route {
  @Route.method
  async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha1');
    const input = fs.createReadStream(filePath);

    // 使用 pipeline 可以自动处理流的关闭和错误捕获
    await pipeline(input, hash);

    return hash.digest('hex').substring(0, 10);
  }
  @Route.method
  async calculateDirectoryHash(dirPath: string): Promise<string> {
    const files = await this.readdirRecursiveSorted(dirPath);
    const hash = crypto.createHash('sha1');

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = await fs.promises.readFile(filePath);
      hash.update(file).update(content);
    }

    return hash.digest('hex').substring(0, 10);
  }

  @Route.method
  async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isDirectory()) {
        totalSize += await this.calculateDirectorySize(filePath);
      } else {
        totalSize += stat.size;
      }
    }

    return totalSize;
  }

  @Route.method
  async createHash(args: { algorithm: string; data: string | Buffer }): Promise<string> {
    const hash = crypto.createHash(args.algorithm).update(args.data).digest('hex');
    return hash;
  }

  private async readdirRecursiveSorted(dirPath: string): Promise<string[]> {
    const files = await fs.promises.readdir(dirPath);
    const result: string[] = [];

    for (const file of files.sort()) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isDirectory()) {
        const folderResult = await this.readdirRecursiveSorted(filePath);
        result.push(...folderResult.map(f => path.join(file, f)));
      } else {
        result.push(file);
      }
    }

    return result;
  }
}

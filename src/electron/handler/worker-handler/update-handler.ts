import {Route} from '@sora-soft/framework';
import fs from 'fs';
import {createWriteStream} from 'fs';
import crypto from 'crypto';
import axios from 'axios';

export interface DownloadOptions {
  onProgress?: (progress: number) => void;
}

export class UpdateHandler extends Route {
  // @Route.method
  // async quitAndInstall(): Promise<void> {
  //   autoUpdater.quitAndInstall();
  // }

  @Route.method
  async downloadUpdate(args: { url: string; destPath: string; options?: DownloadOptions }): Promise<void> {
    const response = await axios({
      method: 'GET',
      url: args.url,
      responseType: 'stream',
    });

    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;

    const writer = createWriteStream(args.destPath);

    response.data.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      if (args.options?.onProgress) {
        const progress = (downloadedSize / totalSize) * 100;
        args.options.onProgress(progress);
      }
    });

    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
      response.data.on('error', reject);
    });
  }

  @Route.method
  async verifyFileHash(args: { filePath: string; expectedHash: string }): Promise<boolean> {
    const content = await fs.promises.readFile(args.filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return hash === args.expectedHash;
  }
}

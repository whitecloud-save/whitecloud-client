import {Connector, NodeTime, Notify, Request, Route} from '@sora-soft/framework';
import fs from 'original-fs';
import got, {Progress} from 'got';
import {chunkFromAsync} from 'chunk-data';
import {Throttle} from '../../throttle.js';
import path from 'path';
import {pipeline} from 'stream/promises';
import crypto from 'crypto';

export interface IReqOssUpload {
  url: string;
  callback: string;
  filename: string;

  saveFilePath: string;
}

export interface IReqOSSDownload {
  url: string;
  savePath: string;
}

export interface IReqDownloadUpdate {
  url: string;
  savePath: string;
  hash: string;
}

export class OssHandler extends Route {
  @Route.method
  async downloadSave(body: IReqOSSDownload, request: Request, connector: Connector) {
    await fs.promises.mkdir(path.dirname(body.savePath), {recursive: true});
    const fileStream = fs.createWriteStream(body.savePath);
    const throttle = new Throttle((progress: Progress) => {
      const callbackId = request.getHeader('callback-id');
      if (callbackId) {
        const notify = new Notify({
          method: 'rpc-callback',
          service: 'electron',
          headers: {
            'callback-id': callbackId,
          },
          payload: progress,
        });
        connector.sendNotify(notify);
      }
    }, NodeTime.second(1));

    await pipeline(
      got.stream(body.url)
        .on('downloadProgress', (progress) => {
          throttle.call(progress);
        }),
      fileStream,
    );

    return {};
  }

  @Route.method
  async uploadSave(body: IReqOssUpload, request: Request, connector: Connector) {
    const fileStream = fs.createReadStream(body.saveFilePath);
    const stat = await fs.promises.stat(body.saveFilePath);
    const throttle = new Throttle((progress: Progress) => {
      const callbackId = request.getHeader('callback-id');
      if (callbackId) {
        const notify = new Notify({
          method: 'rpc-callback',
          service: 'electron',
          headers: {
            'callback-id': callbackId,
          },
          payload: progress,
        });
        connector.sendNotify(notify);
      }
    }, NodeTime.second(1));

    await got.put(body.url, {
      body: chunkFromAsync(fileStream, 65_536),
      headers: {
        'Content-Type': 'application/x-zip-compressed',
        'Content-Length': stat.size.toString(),
        'x-oss-callback': body.callback,
      },
    })
    .on('uploadProgress', progress => {
      throttle.call(progress);
    });

    return {};
  }

  @Route.method
  async downloadUpdate(body: IReqDownloadUpdate, request: Request, connector: Connector) {
    const targetPath = path.resolve(body.savePath);
    await fs.promises.mkdir(path.dirname(targetPath), {recursive: true});
    const tempPath = targetPath + '.tmp';

    if (fs.existsSync(targetPath)) {
      const stat = await fs.promises.stat(targetPath);

      if (stat.isDirectory()) {
        await fs.promises.rm(targetPath, {recursive: true, force: true});
      }

      if (stat.isFile()) {
        const hasher = crypto.createHash('sha1');
        const input = fs.createReadStream(targetPath);
        await pipeline(input, hasher);
        const hash = hasher.digest('hex').substring(0, 10);
        if (hash === body.hash)
          return {};

        await fs.promises.rm(targetPath);
      }

    }

    const throttle = new Throttle((progress: Progress) => {
      const callbackId = request.getHeader('callback-id');
      if (callbackId) {
        const notify = new Notify({
          method: 'rpc-callback',
          service: 'electron',
          headers: {
            'callback-id': callbackId,
          },
          payload: progress,
        });
        connector.sendNotify(notify);
      }
    }, NodeTime.second(1));

    const fileStream = fs.createWriteStream(tempPath);
    await pipeline(
      got.stream(body.url)
        .on('downloadProgress', (progress) => {
          throttle.call(progress);
        }),
      fileStream,
    );
    fileStream.close();

    const hasher = crypto.createHash('sha1');
    const input = fs.createReadStream(tempPath);
    await pipeline(input, hasher);

    const hash = hasher.digest('hex').substring(0, 10);
    if (hash !== body.hash)
      throw new Error('downloaded hash verified failed');

    input.close();

    await fs.promises.rename(tempPath, targetPath);
    return {};
  }
}

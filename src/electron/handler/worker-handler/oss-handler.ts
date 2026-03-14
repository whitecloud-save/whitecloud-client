import {Connector, NodeTime, Notify, Request, Route, Utility} from '@sora-soft/framework';
import fs from 'fs';
import got, {Progress} from 'got';
import {chunkFromAsync} from 'chunk-data';
import {Throttle} from '../../throttle.js';
import path from 'path';
import {pipeline} from 'stream/promises';

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
}

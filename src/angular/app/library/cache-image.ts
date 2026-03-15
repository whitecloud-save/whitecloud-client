import {Utility} from './utility';
import {Observable} from 'rxjs';
import axios from 'axios';
import {PathUtil} from './path-util';
import {workerAPI} from './api/worker-api';
import {ServerService} from '../service/server/server.service';
import {Base64} from 'js-base64';

export class CacheImage {
  constructor(url: string, serverService: ServerService) {
    this.url_ = url;
    this.id_ = Utility.stringHash(url);
    this.loadingPromise_ = null;
    this.serverService_ = serverService;
    this.nativeImage_ = null;
    this.observable_ = new Observable<string>((subscriber) => {
      if (this.nativeImage_) {
        subscriber.next(`data:image/png;base64,${Base64.fromUint8Array(this.nativeImage_)}`);
        subscriber.complete();
        return;
      }

      if (!this.loadingPromise_) {
        this.loadImage();
      }

      this.loadingPromise_!.then(() => {
        workerAPI.fs.readFile(this.filePath).then(data => {
          this.nativeImage_ = data;
          subscriber.next(`data:image/png;base64,${Base64.fromUint8Array(this.nativeImage_)}`);
          subscriber.complete();
        }).catch(err => {
          subscriber.error(err);
        });
      }).catch(err => {
        subscriber.error(err);
      });
    });
  }

  get id() {
    return this.id_;
  }

  get url() {
    return this.observable_;
  }

  get filePath() {
    return `./data/cache/${this.id_}`;
  }

  get nativeImage() {
    return this.nativeImage_;
  }

  private loadImage() {
    this.loadingPromise_ = new Promise<void>(async (resolve, reject) => {
      try {
        const exists = await workerAPI.fs.exists(this.filePath);
        if (exists) {
          resolve();
          return;
        }

        const urlPath = new URL(this.url_);
        switch(urlPath.protocol) {
          case 'file:':
            const content = await workerAPI.fs.readFile(decodeURI(urlPath.pathname.slice(1)));
            await workerAPI.fs.mkdir({path: PathUtil.dirname(this.filePath), options: {recursive: true}});
            await workerAPI.fs.writeFile({path: this.filePath, data: content});
            resolve();
            break;
          case 'oss:':
            const res = await this.serverService_.business.signGameCoverUrl({url: urlPath.pathname.slice(2)});

            await axios.get(res.url, {responseType: 'arraybuffer'})
              .then(async (response) => {
                await workerAPI.fs.mkdir({path: PathUtil.dirname(this.filePath), options: {recursive: true}});
                await workerAPI.fs.writeFile({path: this.filePath, data: response.data});
                resolve();
              }).catch(e => reject(e));
            break;
          case 'http:':
          case 'https:':
            await axios.get(this.url_, {responseType: 'arraybuffer'})
              .then(async (response) => {
                await workerAPI.fs.mkdir({path: PathUtil.dirname(this.filePath), options: {recursive: true}});
                await workerAPI.fs.writeFile({path: this.filePath, data: response.data});
                resolve();
              }).catch(e => reject(e));
            break;
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  private url_: string;
  private id_: string;
  private loadingPromise_: Promise<void> | null;
  private nativeImage_: Uint8Array | null;
  private observable_: Observable<string>;
  private serverService_: ServerService;
}

import {Utility} from './utility';
import {Observable} from 'rxjs';
import axios from 'axios';
import fs from 'fs/promises';
import {mkdirp} from 'mkdirp';
import path from 'path';
import {APP_CONFIG} from '../../environments/environment';
import {ServerService} from '../service/server/server.service';

export class CacheImage {
  constructor(url: string, serverService: ServerService) {
    this.url_ = url;
    this.id_ = Utility.stringHash(url);
    this.loadingPromise_ = null;
    this.nativeImage_ = null;
    this.observable_ = new Observable<string>((subscriber) => {
      if (this.nativeImage_) {
        subscriber.next(`data:image/png;base64,${this.nativeImage_.toString('base64')}`);
        subscriber.complete();
        return;
      }

      if (!this.loadingPromise_) {
        this.loadingPromise_ = new Promise(async (resolve, reject) => {
          try {
            await fs.access(this.filePath, fs.constants.F_OK);
            resolve();
          } catch (err) {
            const urlPath = new URL(this.url_);
            switch(urlPath.protocol) {
              case 'file:':
                await fs.readFile(decodeURI(urlPath.pathname.slice(1))).then(async (content) => {
                  await mkdirp(path.dirname(this.filePath));
                  await fs.writeFile(this.filePath, content as NodeJS.ArrayBufferView);
                  resolve();
                });
                break;
              case 'oss:':
                const res = await serverService.business.signGameCoverUrl({url: urlPath.pathname.slice(2)});

                await axios.get(res.url, {responseType: 'arraybuffer'})
                  .then(async (response) => {
                    await mkdirp(path.dirname(this.filePath));
                    await fs.writeFile(this.filePath, Buffer.from(response.data) as NodeJS.ArrayBufferView);
                    resolve();
                  }).catch(e => reject(e));
                break;
              case 'http:':
              case 'https:':
                await axios.get(this.url_, {responseType: 'arraybuffer'})
                  .then(async (response) => {
                    await mkdirp(path.dirname(this.filePath));
                    await fs.writeFile(this.filePath, Buffer.from(response.data) as NodeJS.ArrayBufferView);
                    resolve();
                  }).catch(e => reject(e));
                break;
            }
          }
        });
      }

      this.loadingPromise_.then(async () => {
        this.nativeImage_ = await fs.readFile(this.filePath);
        subscriber.next(`data:image/png;base64,${this.nativeImage_.toString('base64')}`);
        subscriber.complete();
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

  private url_: string;
  private id_: string;
  private loadingPromise_: Promise<void> | null;
  private nativeImage_: Buffer | null;
  private observable_: Observable<string>;
}

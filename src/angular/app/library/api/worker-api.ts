import {Client, IWorkerChannel} from './client';
import type {OssHandler} from '@electron/handler/worker-handler/oss-handler';
import type {UpdateHandler} from '@electron/handler/worker-handler/update-handler';
import type {FsHandler} from '@electron/handler/worker-handler/fs-handler';
import type {IconHandler} from '@electron/handler/worker-handler/icon-handler';
import type {ProcessHandler} from '@electron/handler/worker-handler/process-handler';
import type {DatabaseHandler} from '@electron/handler/worker-handler/database-handler';
import type {CryptoHandler} from '@electron/handler/worker-handler/crypto-handler';
import type {ZipHandler} from '@electron/handler/worker-handler/zip-handler';

declare const window: ClientWindow;
export interface ClientWindow {
  workerChannel: IWorkerChannel;
}

export class WorkerAPI {
  private static instance_: WorkerAPI | null = null;
  private client_: Client;

  private constructor() {
    this.client_ = new Client(window.workerChannel);
  }

  static getInstance(): WorkerAPI {
    if (!WorkerAPI.instance_) {
      WorkerAPI.instance_ = new WorkerAPI();
    }
    return WorkerAPI.instance_;
  }

  get fs() {
    return this.client_.createApi<FsHandler>('fs');
  }

  get zip() {
    return this.client_.createApi<ZipHandler>('zip');
  }

  get crypto() {
    return this.client_.createApi<CryptoHandler>('crypto');
  }

  get db() {
    return this.client_.createApi<DatabaseHandler>('db');
  }

  get process() {
    return this.client_.createApi<ProcessHandler>('process');
  }

  get icon() {
    return this.client_.createApi<IconHandler>('icon');
  }

  get update() {
    return this.client_.createApi<UpdateHandler>('update');
  }

  get oss() {
    return this.client_.createApi<OssHandler>('oss');
  }
}

export const workerAPI = WorkerAPI.getInstance();

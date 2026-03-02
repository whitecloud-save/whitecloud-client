import {Injectable} from '@angular/core';
import {ServerService} from './server/server.service';
import {v4} from 'uuid';
import fs from 'fs/promises';
import axios from 'axios';
import {APP_CONFIG} from '../../environments/environment';
import {BaseError} from '../library/error/BaseError';
import {ErrorCode} from '../library/error/ErrorCode';
import {Save} from '../entity/save';
import {ConnectionStateService} from './connection-state.service';

interface IUploadFormData {
  name: string;
  policy: string;
  accessKey: string;
  signature: string;
  dir: string;
  callback?: string;
  file: File;
}

@Injectable({
  providedIn: 'root',
})
export class OssService {
  constructor(
    private server: ServerService,
    private connectionStateService: ConnectionStateService,
  ) {}

  private buildFormData(data: IUploadFormData) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('policy', data.policy);
    formData.append('OSSAccessKeyId', data.accessKey);
    formData.append('success_action_status', '200');
    formData.append('signature', data.signature);
    formData.append('key', data.dir + data.name);
    if (data.callback) {
      formData.append('callback', data.callback);
    }
    formData.append('file', data.file);
    return formData;
  }

  async uploadGameSave(save: Save, file: File) {
    this.connectionStateService.startRequest();
    try {
      const data = await this.server.business.generateGameSaveSignature({
        gameId: save.game.id,
        saveId: save.id,
        remark: save.remark,
        size: save.size,
        stared: save.stared,
        hostname: save.hostname,
        createTime: save.createTime,
        directoryHash: save.directoryHash,
        zipHash: save.zipHash,
        directorySize: save.directorySize,
      });
      const name = `${save.id}.zip`;
      const formData = this.buildFormData({
        name,
        ...data,
        file,
      });
      await fetch(data.host, {method: 'POST', body: formData});
      return data.dir + name;
    } finally {
      this.connectionStateService.endRequest();
    }
  }

  async uploadAvatar(file: File) {
    if (file.size > 1024 * 1024)
      throw new BaseError(ErrorCode.ERR_IMAGE_TOO_LARGE, 'ERR_IMAGE_TOO_LARGE', {max: '1mb'});

    this.connectionStateService.startRequest();
    try {
      const data = await this.server.business.generateAvatarUploadSignature();
      const name = v4();
      const formData = this.buildFormData({
        name,
        ...data,
        file,
      });
      await fetch(data.host, {method: 'POST', body: formData});
      return data.dir + name;
    } finally {
      this.connectionStateService.endRequest();
    }
  }

  async uploadGameCover(gameId: string, file: File) {
    if (file.size > 1024 * 1024)
      throw new BaseError(ErrorCode.ERR_IMAGE_TOO_LARGE, 'ERR_IMAGE_TOO_LARGE', {max: '1mb'});

    const data = await this.server.business.generateGameCoverUploadSignature({
      gameId,
    });
    const name = v4();
    const formData = this.buildFormData({
      name,
      ...data,
      file,
    });
    await fetch(data.host, {method: 'POST', body: formData});
    return data.dir + name;
  }

  async readUrl(url: string): Promise<Buffer> {
    const urlPath = new URL(url);
    switch(urlPath.protocol) {
      case 'file:': {
        return fs.readFile(decodeURI(urlPath.pathname.slice(1)));
      }
      case 'oss:': {
        const res = await axios.get(`${APP_CONFIG.ossEndpoint}${urlPath.pathname}`, {responseType: 'arraybuffer'});
        return res.data as Buffer;
      }
      case 'http:':
      case 'https:': {
        const res = await axios.get(url, {responseType: 'arraybuffer'});
        return res.data as Buffer;
      }
      default:
        throw new Error('protocol not supported');
    }
  }
}

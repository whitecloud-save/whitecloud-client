import {Injectable} from '@angular/core';
import {ServerService} from './server/server.service';
import {v4} from 'uuid';
// import fs from 'fs/promises';
import axios from 'axios';
import {APP_CONFIG} from '../../environments/environment';
import {BaseError} from '../library/error/BaseError';
import {ErrorCode} from '../library/error/ErrorCode';
import {Save} from '../entity/save';
import {ConnectionStateService} from './connection-state.service';
import {workerAPI} from '../library/api/worker-api';
import {RemoteSave} from 'app/entity/remote-save';
import {SaveProgressType, SaveTransferService} from './save-transfer.service';

interface IUploadFormData {
  name: string;
  policy: string;
  accessKey: string;
  signature: string;
  dir: string;
  callback?: string;
  file: File;
}

export type Progress = {
  percent: number;
  transferred: number;
  total?: number;
};

@Injectable({
  providedIn: 'root',
})
export class OssService {
  constructor(
    private server: ServerService,
    private saveTransfer: SaveTransferService,
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

  async downloadGameSave(save: Save | RemoteSave) {
    if (!save.ossPath)
      throw new BaseError(ErrorCode.ERR_SAVE_MISS_OSS_PATH, 'download save without oss path');

    const notification = this.saveTransfer.startSaveTransfer(save.game.name, save.game.iconPath, SaveProgressType.Download);
    notification.start();

    const res = await this.server.business.signGameSaveUrl({url: save.ossPath});
    await workerAPI.oss.downloadSave({
      url: res.url,
      savePath: save.filename,
    }, (progress: Progress) => {
      notification.update(progress.percent * 100);
    }).finally(() => {
      notification.close();
    });;
  }

  async uploadGameSave(save: Save) {
    const notification = this.saveTransfer.startSaveTransfer(save.game.name, save.game.iconPath, SaveProgressType.Upload);
    notification.start();

    const data = await this.server.business.generateGameSaveSignatureV4({
      gameId: save.game.id,
      saveId: save.id,
      remark: save.remark,
      size: save.size.toString(),
      stared: save.stared,
      hostname: save.hostname,
      createTime: save.createTime,
      directoryHash: save.directoryHash,
      zipHash: save.zipHash,
      directorySize: save.directorySize?.toString(),
    });

    await workerAPI.oss.uploadSave({
      ...data,
      saveFilePath: save.filename,
    }, (progress: Progress) => {
      notification.update(progress.percent * 100);
    }).finally(() => {
      notification.close();
    });

    return data.filename;
  }

  async uploadAvatar(file: File) {
    if (file.size > 1024 * 1024)
      throw new BaseError(ErrorCode.ERR_IMAGE_TOO_LARGE, 'ERR_IMAGE_TOO_LARGE', {max: '1mb'});

    const data = await this.server.business.generateAvatarUploadSignature();
    const name = v4();
    const formData = this.buildFormData({
      name,
      ...data,
      file,
    });
    await fetch(data.host, {method: 'POST', body: formData});
    return data.dir + name;
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
}

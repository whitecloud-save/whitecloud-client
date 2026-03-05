export interface IGameExtraSetting {
  LEProfile?: string;
}

export class LocalGameDB {
  constructor(data?: Partial<LocalGameDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  id!: string;
  name!: string;
  gamePath!: string;
  savePath!: string;
  exeFile!: string;
  createTime!: number;
  coverImgUrl!: string;
  localSaveNum!: number;
  autoOpenGuide!: boolean;
  order!: number;
  extraSetting!: IGameExtraSetting;
  updateTime!: number;
  lastGameHistorySyncTime!: number;
  saveBackupLimit!: number;
  useCustomSaveBackupLimit!: boolean;
}

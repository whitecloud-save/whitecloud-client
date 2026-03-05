export enum GameActivityType {
  SAVE_BACKUP_LOCAL = 'SAVE_BACKUP_LOCAL',
  SAVE_BACKUP_CLOUD = 'SAVE_BACKUP_CLOUD',
  SAVE_UPLOAD_FAILED = 'SAVE_UPLOAD_FAILED',
  SAVE_BACKUP_LOCAL_FAILED = 'SAVE_BACKUP_LOCAL_FAILED',
}

export interface GameActivityData {
  [key: string]: any;
}

export interface SaveUploadFailedData extends GameActivityData {
  reason: string;
}

export class GameActivityDB {
  constructor(data?: Partial<GameActivityDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  id!: number;
  gameId!: string;
  type!: GameActivityType;
  data!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

import {Injectable} from '@angular/core';
import {AppDataSource} from '../library/database';
import {
  GameActivityDB,
  GameActivityType,
  GameActivityData,
  SaveUploadFailedData,
} from '../database/game-activity';
import {GameHistoryDB} from '../database/game-history';
import {ErrorString} from '../library/error/ErrorString';
import {NodeTime, UnixTime} from '../library/utility';
import {UserErrorCode} from './server/api';

export interface GameActivity {
  id: string;
  gameId: string;
  type: GameActivityType | 'GAME_TIME';
  content: string;
  createdAt: Date;
  data?: string;
}

export interface GameTimeActivity extends GameActivity {
  type: 'GAME_TIME';
  hostName: string;
  gameTime: number;
}

export interface BackupActivity extends GameActivity {
  type: GameActivityType.SAVE_BACKUP_LOCAL | GameActivityType.SAVE_BACKUP_CLOUD;
}

export interface UploadFailedActivity extends GameActivity {
  type: GameActivityType.SAVE_UPLOAD_FAILED;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameActivityService {
  UserErrorCode = UserErrorCode;

  constructor() {}

  async createActivity(gameId: string, type: GameActivityType, data: GameActivityData, offset = 0): Promise<GameActivityDB> {
    const activity = new GameActivityDB();
    activity.gameId = gameId;
    activity.type = type;
    activity.data = JSON.stringify(data);
    activity.createdAt = new Date(NodeTime.now() + offset * 1000);
    return await AppDataSource.manager.save(activity);
  }

  async saveBackupLocal(gameId: string, offset = 0): Promise<GameActivityDB> {
    return await this.createActivity(gameId, GameActivityType.SAVE_BACKUP_LOCAL, {}, offset);
  }

  async saveBackupCloud(gameId: string, offset = 0): Promise<GameActivityDB> {
    return await this.createActivity(gameId, GameActivityType.SAVE_BACKUP_CLOUD, {}, offset);
  }

  async saveUploadFailed(gameId: string, reason: string, offset = 0): Promise<GameActivityDB> {
    const data: SaveUploadFailedData = {reason};
    return await this.createActivity(gameId, GameActivityType.SAVE_UPLOAD_FAILED, data, offset);
  }

  async getActivitiesByGameId(gameId: string): Promise<GameActivity[]> {
    const activities = await AppDataSource.manager.find(GameActivityDB, {
      where: {gameId},
      order: {createdAt: 'DESC'},
    });

    return activities.map(activity => ({
      id: String(activity.id),
      gameId: activity.gameId,
      type: activity.type,
      content: this.generateContent(activity.type, activity.data),
      createdAt: activity.createdAt,
      data: activity.data,
    }));
  }

  async getGameHistoryByGameId(gameId: string): Promise<GameHistoryDB[]> {
    return await AppDataSource.manager.find(GameHistoryDB, {
      where: {gameId},
      order: {endTime: 'DESC'},
    });
  }

  async getCombinedActivities(gameId: string): Promise<GameActivity[]> {
    const activities = await this.getActivitiesByGameId(gameId);
    const historyList = await this.getGameHistoryByGameId(gameId);

    const gameTimeActivities: GameTimeActivity[] = historyList.map(history => ({
      id: history.id,
      gameId: history.gameId,
      type: 'GAME_TIME',
      content: `在${history.host}上游玩了 ${this.formatGameTime(history.endTime - history.startTime)}`,
      createdAt: new Date(history.endTime * 1000),
      hostName: history.host,
      gameTime: history.endTime - history.startTime,
    }));

    return [...activities, ...gameTimeActivities].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateContent(type: GameActivityType, dataStr: string): string {
    const data = JSON.parse(dataStr) as GameActivityData;

    switch (type) {
      case GameActivityType.SAVE_BACKUP_LOCAL:
        return '存档已备份';
      case GameActivityType.SAVE_BACKUP_CLOUD:
        return '存档已备份，并上传至云储存';
      case GameActivityType.SAVE_UPLOAD_FAILED:
        const failedData = data as SaveUploadFailedData;
        return `存档上传失败：${ErrorString[failedData.reason] || failedData.reason}`;
      case GameActivityType.SAVE_BACKUP_LOCAL_FAILED:
        return '存档备份失败';
      default:
        return '';
    }
  }

  private formatGameTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟`;
    } else {
      return `${seconds}秒`;
    }
  }
}

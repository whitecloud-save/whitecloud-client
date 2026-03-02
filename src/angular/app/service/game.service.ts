import {Injectable} from '@angular/core';
import {Game} from '../entity/game';
import {LocalGameDB} from '../database/game';
import {GameHistoryDB} from '../database/game-history';
import {GameUtil, UnixTime} from '../library/utility';
import {BehaviorSubject} from 'rxjs';
import {ProcessMonitorService} from './process-monitor.service';
import {AppDataSource} from '../library/database';
import {v4} from 'uuid';
import {SettingService} from './setting.service';
import {UserService} from './user.service';
import {OssService} from './oss.service';
import {ServerService} from './server/server.service';
import {ClientNotifyHandler} from './server/api';
import {RemoteGame} from '../entity/remote-game';
import {RemoteSave} from '../entity/remote-save';
import {Save} from '../entity/save';
import {GameActivityService} from './game-activity.service';
import {ErrorHandlingUtil} from './error-handling-util';
import {SaveTransferService} from './save-transfer.service';

export interface IImportGameParams {
  name: string;
  gamePath: string;
  savePath: string;
  exeFile: string;
  coverImgUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {

  games: BehaviorSubject<Game[]> = new BehaviorSubject([] as Game[]);
  remoteGames: BehaviorSubject<RemoteGame[]> = new BehaviorSubject([] as RemoteGame[]);
  private gameRepo =  AppDataSource.getRepository(LocalGameDB);

  constructor(
    private processMonitorService: ProcessMonitorService,
    private settingService: SettingService,
    private userService: UserService,
    private ossService: OssService,
    private serverService: ServerService,
    private gameActivityService: GameActivityService,
    private errorHandlingUtil: ErrorHandlingUtil,
    private saveTransferService: SaveTransferService,
  ) {
    this.serverService.notify<ClientNotifyHandler>().notifyGameUpdate().subscribe((update) => {
      const game = this.getGame(update.gameId);
      if (game) {
        game.syncFromServer(update);
      }

      const remoteGame = this.getRemoteGame(update.gameId);
      if (remoteGame) {
        remoteGame.syncFromServer(update);
      }
    });

    this.serverService.notify<ClientNotifyHandler>().notifyGameDeleted().subscribe(() => {
      this.syncGameList();
    });

    this.serverService.notify<ClientNotifyHandler>().notifyGameSaveUpdate().subscribe((data) => {
      console.log('notifyGameSaveUpdate', data);
      const game = this.getGame(data.gameId);
      if (!game)
        return;
      const save = game.getSave(data.saveId);
      console.log(save);
      if (!save) {
        const remoteSave = new RemoteSave(game, data);
        game.addSave(remoteSave);
        return;
      }
      save.syncFromServer(data);
    });

    this.serverService.notify<ClientNotifyHandler>().notifyGameSaveDelete().subscribe((data) => {
      const game = this.getGame(data.gameId);
      if (!game)
        return;

      game.deleteSaveRemoteInfo(data.saveId);
    });

    this.serverService.notify<ClientNotifyHandler>().notifyGameHistoryUpdate().subscribe(async (histories) => {
      for (const history of histories) {
        const game = this.getGame(history.gameId);
        if (!game)
          continue;

        const historyRepo = AppDataSource.getRepository(GameHistoryDB);
        const existing = await historyRepo.findOne({
          where: { id: history.id }
        });

        if (!existing) {
          const historyDB = historyRepo.create({
            id: history.id,
            gameId: history.gameId,
            host: history.host,
            startTime: history.startTime,
            endTime: history.endTime,
            synced: 1,
            createTime: history.createTime,
          });
          await AppDataSource.manager.save(historyDB);
          game.addHistory(historyDB);
        } else {
          existing['startTime'] = history.startTime;
          existing['endTime'] = history.endTime;
          existing['host'] = history.host;
          existing['createTime'] = history.createTime;
          existing['synced'] = 1;
          await AppDataSource.manager.save(existing);
        }

        await game.updateLastGameHistorySyncTime(history.createTime);
      }
    });

    this.userService.logged.subscribe(async (logged) => {
      console.log('logged.subscribe', logged);
      if (logged) {
        for (const game of this.games.getValue()) {
          await this.uploadGameCover(game);
          await game.syncUnsyncedHistory();
        }
        this.syncGameList();
      } else {
        for (const game of this.remoteGames.getValue()) {
          this.removeRemoteGame(game);
        }
        for (const game of this.games.getValue()) {
          game.removeAllRemoteSave();
        }
      }
    });
  }

  async syncGameList() {
    if (!this.userService.logged.getValue())
      return;

    const list = await this.serverService.business.fetchUserGame();

    const localRemoteGame = this.remoteGames.getValue();
    for (const game of localRemoteGame) {
      if (!list.find(data => data.gameId === game.id))
        this.removeRemoteGame(game);
    }

    for (const data of list) {
      if (data.deleted) {
        const game = this.getGame(data.gameId);
        if (game) {
          this.removeLocalGame(game);
        }
        continue;
      }

      const game = this.getGame(data.gameId);
      if (!game) {
        const remoteGame = this.getRemoteGame(data.gameId);
        if (!remoteGame) {
          const newRemoteGame = new RemoteGame(data, this.serverService);
          this.addRemoteGame(newRemoteGame);
        } else {
          remoteGame.syncFromServer(data);
        }
        continue;
      }

      game.syncFromServer(data);
      game.syncSaveList();
    }
  }

  async uploadGameCover(game: Game) {
    if (game.coverImgUrl.startsWith('oss')) {
      return;
    }

    const image = game.cachedCoverImage.nativeImage;
    if (!image)
      return;

    const file = new File([image as any], v4());
    const key = await this.ossService.uploadGameCover(game.id, file);
    game.coverImgUrl = `oss://${key}`;
    game.save();
  }

  async importRemoteGame(remoteGame: RemoteGame, params: {savePath: string; gamePath: string}) {
    const games = this.games.getValue();
    const order = games.length ? games[0].order + 1 : 1;

    const savePath = GameUtil.encodePath(params.savePath, params.gamePath);
    const gameDB = this.gameRepo.create({
      id: remoteGame.id,
      name: remoteGame.name,
      gamePath: params.gamePath,
      exeFile: remoteGame.exePath,
      savePath,
      createTime: UnixTime.now(),
      coverImgUrl: remoteGame.coverImgUrl as string,
      order,
    });
    const game = new Game(gameDB, this.processMonitorService, this.settingService, this, this.serverService, this.userService, this.ossService, this.gameActivityService, this.errorHandlingUtil, this.saveTransferService);
    game.cloudSaveNum = remoteGame.cloudSaveNum;
    await game.save();
    this.addGame(game);
    await game.zipSave();
    await (game as any).updateCurrentSave();

    this.removeRemoteGame(remoteGame);
  }

  deleteRemoteSave(save: RemoteSave | Save) {
    return this.serverService.business.deleteGameSave({
      saveId: save.id,
      gameId: save.game.id,
    });
  }

  clearGameSaves(gameId: string) {
    return this.serverService.business.clearGameSaves({ gameId });
  }

  async downloadSave(save: RemoteSave | Save) {
    const game = save.game;
    const saveTransferService = this.saveTransferService;

    saveTransferService.startTransfer('download', save.id, game.id, save.remark);

    const showNotification = setTimeout(() => {
      saveTransferService.showProgressNotification(game.name, 'download');
    }, 1000);

    try {
      if (save instanceof Save) {
        await save.download();
      } else {
        const localSave = await save.download();
        game.replaceRemoteSave(save, localSave);
      }
    } finally {
      clearTimeout(showNotification);
      saveTransferService.endTransfer();
    }
  }

  async importGame(params: IImportGameParams) {
    const savePath = GameUtil.encodePath(params.savePath, params.gamePath);

    const games = this.games.getValue();
    const order = games.length ? games[0].order + 1 : 1;

    const gameDB = this.gameRepo.create({
      id: v4(),
      name: params.name,
      gamePath: params.gamePath,
      exeFile: params.exeFile,
      savePath,
      createTime: UnixTime.now(),
      coverImgUrl: params.coverImgUrl,
      order,
    });
    const game = new Game(gameDB, this.processMonitorService, this.settingService, this, this.serverService, this.userService, this.ossService, this.gameActivityService, this.errorHandlingUtil, this.saveTransferService);
    await game.save();
    await game.zipSave();
    this.addGame(game);
  }

  addDBGame(gameDB: LocalGameDB) {
    const game = new Game(gameDB, this.processMonitorService, this.settingService, this, this.serverService, this.userService, this.ossService, this.gameActivityService, this.errorHandlingUtil, this.saveTransferService);
    this.addGame(game);
  }

  addGame(game: Game) {
    const pre = this.games.getValue();
    this.games.next([...pre, game].sort((i, j) => j.order - i.order));
  }

  addRemoteGame(game: RemoteGame) {
    const pre = this.remoteGames.getValue();
    this.remoteGames.next([...pre, game].sort((i, j) => j.order - i.order));
  }

  getGame(id: string) {
    const games = this.games.getValue();
    return games.find(game => game.id === id);
  }

  getRemoteGame(id: string) {
    const games = this.remoteGames.getValue();
    return games.find(game => game.id === id);
  }

  removeLocalGame(game: Game) {
    const pre = this.games.getValue();
    this.games.next(pre.filter(g => g !== game));
    game.removeFromLocal();
    this.syncGameList();
  }

  removeRemoteGame(game: RemoteGame) {
    const pre = this.remoteGames.getValue();
    this.remoteGames.next(pre.filter(g => g !== game));
  }

  syncRemoveRemoteGame(game: RemoteGame) {
    return this.serverService.business.removeGame({
      gameId: game.id,
    });
  }

  async swapGameOrder(a: Game, b: Game) {
    if (!a || !b)
      return;

    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    await a.save();
    await b.save();
    const games = this.games.getValue();
    this.games.next(games.sort((i, j) => j.order - i.order));
  }

  async init() {
    const gameDBs = await this.gameRepo.find({
      order: {
        order: 'desc',
      },
    });
    let index = gameDBs.length;
    for (const db of gameDBs) {
      if (db.order !== index) {
        db.order = index;
        await AppDataSource.manager.save(db);
      }
      index--;
      this.addDBGame(db);
    }
  }
}

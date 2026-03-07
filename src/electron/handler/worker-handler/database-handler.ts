import {Route} from '@sora-soft/framework';
import {DataSource, ObjectLiteral} from 'typeorm';
import {LocalGameDB, SaveDB, GameHistoryDB, GameGuideDB, GameActivityDB} from '../../database/index.js';

export class DatabaseHandler extends Route {
  private dataSource_: DataSource | null = null;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource_ = dataSource;
  }

  private getRepository<T extends ObjectLiteral>(entity: new () => T) {
    if (!this.dataSource_) {
      throw new Error('Database not initialized');
    }
    return this.dataSource_.getRepository<T>(entity);
  }

  @Route.method
  async saveGame(game: LocalGameDB): Promise<LocalGameDB> {
    return await this.getRepository(LocalGameDB).save(game);
  }

  @Route.method
  async findGame(gameId: string): Promise<LocalGameDB | null> {
    return await this.getRepository(LocalGameDB).findOne({ where: { id: gameId } });
  }

  @Route.method
  async findGames(body: void): Promise<LocalGameDB[]> {
    return await this.getRepository(LocalGameDB).find({
      order: {
        order: 'desc',
      },
    });
  }

  @Route.method
  async deleteGame(gameId: string): Promise<void> {
    await this.getRepository(LocalGameDB).delete(gameId);
  }

  @Route.method
  async saveSave(save: SaveDB): Promise<SaveDB> {
    return await this.getRepository(SaveDB).save(save);
  }

  @Route.method
  async findSaves(gameId: string): Promise<SaveDB[]> {
    return await this.getRepository(SaveDB).find({
      where: {
        gameId
      },
      order: {
        createTime: 'desc',
      },
    });
  }

  @Route.method
  async deleteSave(saveId: string): Promise<void> {
    await this.getRepository(SaveDB).delete(saveId);
  }

  @Route.method
  async deleteSavesByGame(gameId: string): Promise<void> {
    await this.getRepository(SaveDB).delete({ gameId });
  }

  @Route.method
  async deleteGameActivityByGame(gameId: string) {
    await this.getRepository(GameActivityDB).delete({gameId});
  }

  @Route.method
  async deleteGameGuidByGame(gameId: string) {
    await this.getRepository(GameGuideDB).delete({gameId});
  }

  @Route.method
  async saveGameHistory(history: GameHistoryDB): Promise<GameHistoryDB> {
    return await this.getRepository(GameHistoryDB).save(history);
  }

  @Route.method
  async findGameHistory(gameId: string): Promise<GameHistoryDB[]> {
    return await this.getRepository(GameHistoryDB).find({
      where: {
        gameId
      },
      order: {
        endTime: 'DESC'
      },
    });
  }

  @Route.method
  async findOneGameHistory(id: string) {
    return this.getRepository(GameHistoryDB).findOne({
      where: {id}
    });
  }

  @Route.method
  async deleteGameHistoryByGame(gameId: string): Promise<void> {
    await this.getRepository(GameHistoryDB).delete({ gameId });
  }

  @Route.method
  async saveGameGuide(guide: GameGuideDB): Promise<GameGuideDB> {
    return await this.getRepository(GameGuideDB).save(guide);
  }

  @Route.method
  async findGameGuide(gameId: string): Promise<GameGuideDB | null> {
    return await this.getRepository(GameGuideDB).findOne({ where: { gameId } });
  }

  @Route.method
  async saveGameActivity(activity: GameActivityDB): Promise<GameActivityDB> {
    return await this.getRepository(GameActivityDB).save(activity);
  }

  @Route.method
  async findGameActivities(gameId: string): Promise<GameActivityDB[]> {
    return await this.getRepository(GameActivityDB).find({ where: { gameId } });
  }
}

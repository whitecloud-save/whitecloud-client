import {LocalGameDB} from '../database/game';
import {DataSource} from 'typeorm';
import {SaveDB} from '../database/save';
import {GameHistoryDB} from '../database/game-history';
import {GameGuideDB} from '../database/game-guide';
import {GameActivityDB} from '../database/game-activity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'data/db.sqlite',
  synchronize: true,
  entities: [LocalGameDB, SaveDB, GameHistoryDB, GameGuideDB, GameActivityDB],
  subscribers: [],
  migrations: [],
  logging: false,
  logger: 'simple-console',
});

export const connect = async () => {
  await AppDataSource.initialize();
};

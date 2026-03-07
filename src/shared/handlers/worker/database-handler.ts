import {LocalGameDB} from '../../database/game';
import {SaveDB} from '../../database/save';
import {GameHistoryDB} from '../../database/game-history';
import {GameGuideDB} from '../../database/game-guide';
import {GameActivityDB} from '../../database/game-activity';

export interface DatabaseHandler {
  saveGame(game: LocalGameDB): Promise<LocalGameDB>;
  findGame(gameId: string): Promise<LocalGameDB | null>;
  findGames(body: void): Promise<LocalGameDB[]>;
  deleteGame(gameId: string): Promise<void>;
  saveSave(save: SaveDB): Promise<SaveDB>;
  findSaves(gameId: string): Promise<SaveDB[]>;
  deleteSave(saveId: string): Promise<void>;
  deleteSavesByGame(gameId: string): Promise<void>;
  deleteGameActivityByGame(gameId: string): Promise<void>;
  deleteGameGuidByGame(gameId: string): Promise<void>;
  saveGameHistory(history: GameHistoryDB): Promise<GameHistoryDB>;
  findGameHistory(gameId: string): Promise<GameHistoryDB[]>;
  findOneGameHistory(id: string): Promise<GameHistoryDB | null>;
  deleteGameHistoryByGame(gameId: string): Promise<void>;
  saveGameGuide(guide: GameGuideDB): Promise<GameGuideDB>;
  findGameGuide(gameId: string): Promise<GameGuideDB | null>;
  saveGameActivity(activity: GameActivityDB): Promise<GameActivityDB>;
  findGameActivities(gameId: string): Promise<GameActivityDB[]>;
}

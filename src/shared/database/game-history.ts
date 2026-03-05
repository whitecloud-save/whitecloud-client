export class GameHistoryDB {
  constructor(data?: Partial<GameHistoryDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  id!: string;
  gameId!: string;
  host!: string;
  startTime!: number;
  endTime!: number;
  synced!: number;
  createTime!: number;
}

export class GameGuideDB {
  constructor(data?: Partial<GameGuideDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }
  gameId!: string;
  content!: string;
  alwaysTop!: boolean;
}

export class SaveDB {
  constructor(data?: Partial<SaveDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  id!: string;
  gameId!: string;
  createTime!: number;
  remark!: string;
  hostname!: string;
  size!: number;
  started!: boolean;
  updateTime!: number;
  directoryHash!: string | null;
  zipHash!: string | null;
  directorySize!: number | null;
}

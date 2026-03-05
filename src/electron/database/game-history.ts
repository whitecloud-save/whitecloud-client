import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class GameHistoryDB {
  constructor(data?: Partial<GameHistoryDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  gameId!: string;

  @Column()
  host!: string;

  @Column()
  startTime!: number;

  @Column()
  endTime!: number;

  @Column({ default: 0 })
  synced!: number;

  @Column({ default: 0 })
  createTime!: number;
}

import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class GameGuideDB {
  constructor(data?: Partial<GameGuideDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  @PrimaryColumn('uuid')
  gameId!: string;

  @Column('text')
  content!: string;

  @Column()
  alwaysTop!: boolean;
}

import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class GameGuideDB {
  @PrimaryColumn('uuid')
  gameId!: string;

  @Column('text')
  content!: string;

  @Column()
  alwaysTop!: boolean;
}

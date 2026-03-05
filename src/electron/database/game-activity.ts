import {Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from 'typeorm';

export enum GameActivityType {
  SAVE_BACKUP_LOCAL = 'SAVE_BACKUP_LOCAL',
  SAVE_BACKUP_CLOUD = 'SAVE_BACKUP_CLOUD',
  SAVE_UPLOAD_FAILED = 'SAVE_UPLOAD_FAILED',
  SAVE_BACKUP_LOCAL_FAILED = 'SAVE_BACKUP_LOCAL_FAILED',
}

@Entity()
export class GameActivityDB {
  constructor(data?: Partial<GameActivityDB>) {
    if (!data)
      return;

    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid')
  gameId!: string;

  @Column()
  type!: GameActivityType;

  @Column('text')
  data!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

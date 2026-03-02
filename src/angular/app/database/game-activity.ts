import {Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from 'typeorm';

export enum GameActivityType {
  SAVE_BACKUP_LOCAL = 'SAVE_BACKUP_LOCAL',
  SAVE_BACKUP_CLOUD = 'SAVE_BACKUP_CLOUD',
  SAVE_UPLOAD_FAILED = 'SAVE_UPLOAD_FAILED',
  SAVE_BACKUP_LOCAL_FAILED = 'SAVE_BACKUP_LOCAL_FAILED',
}

export interface GameActivityData {
  [key: string]: any;
}

export interface SaveUploadFailedData extends GameActivityData {
  reason: string;
}

@Entity()
export class GameActivityDB {
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

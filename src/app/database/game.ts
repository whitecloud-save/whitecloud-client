import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

export interface IGameExtraSetting {
  LEProfile?: string;
}

@Entity()
export class LocalGameDB {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  gamePath!: string;

  @Column()
  savePath!: string;

  @Column()
  exeFile!: string;

  @Column()
  createTime!: number;

  @Column()
  coverImgUrl!: string;

  @Column({default: 0})
  localSaveNum!: number;

  @Column({default: false})
  autoOpenGuide!: boolean;

  @Column({default: 0})
  order!: number;

  @Column({type: 'simple-json', default: '{}'})
  extraSetting!: IGameExtraSetting;

  @Column({default: 0})
  updateTime!: number;

  @Column({default: 0})
  lastGameHistorySyncTime!: number;

  @Column({default: 100})
  saveBackupLimit!: number;

  @Column({default: false})
  useCustomSaveBackupLimit!: boolean;
}

import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class SaveDB {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  gameId!: string;

  @Column()
  createTime!: number;

  @Column()
  remark!: string;

  @Column()
  hostname!: string;

  @Column({default: 0})
  size!: number;

  @Column({default: false})
  started!: boolean;

  @Column()
  updateTime!: number;

  @Column({type: 'text', nullable: true})
  directoryHash!: string | null;

  @Column({type: 'text', nullable: true})
  zipHash!: string | null;

  @Column({type: 'integer', nullable: true})
  directorySize!: number | null;
}

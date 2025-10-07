import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { CharacterSet } from './character-set.entity';

@Entity({ name: 'game_config_snapshots' })
export class GameConfigSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Game, (game: Game) => game.configSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @ManyToOne(
    () => CharacterSet,
    (characterSet: CharacterSet) => characterSet.configSnapshots,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'character_set_id' })
  characterSet?: CharacterSet | null;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  settings!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

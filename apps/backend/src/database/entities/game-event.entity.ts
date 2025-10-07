import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Round } from './round.entity';
import { GamePlayer } from './game-player.entity';
import { GameEventType } from '../enums';

@Entity({ name: 'game_events' })
@Index('idx_game_events_created', ['createdAt'])
export class GameEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Game, (game: Game) => game.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @ManyToOne(() => Round, (round: Round) => round.events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'round_id' })
  round?: Round | null;

  @Column({
    type: 'enum',
    enum: GameEventType,
    enumName: 'game_event_type',
  })
  eventType!: GameEventType;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actor_player_id' })
  actor?: GamePlayer | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

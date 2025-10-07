import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';
import { RoundState } from '../enums';
import { Question } from './question.entity';
import { Guess } from './guess.entity';
import { GameEvent } from './game-event.entity';

@Entity({ name: 'rounds' })
@Index('ux_rounds_game_number', ['game', 'roundNumber'], { unique: true })
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Game, (game: Game) => game.rounds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @Column({ type: 'int' })
  roundNumber!: number;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.activeRounds, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'active_player_id' })
  activePlayer?: GamePlayer | null;

  @Column({
    type: 'enum',
    enum: RoundState,
    enumName: 'round_state',
    default: RoundState.AWAITING_QUESTION,
  })
  state!: RoundState;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date | null;

  @Column({ type: 'int', nullable: true })
  durationMs?: number | null;

  @OneToMany(() => Question, (question: Question) => question.round)
  questions?: Question[];

  @OneToMany(() => Guess, (guess: Guess) => guess.round)
  guesses?: Guess[];

  @OneToMany(() => GameEvent, (event: GameEvent) => event.round)
  events?: GameEvent[];
}

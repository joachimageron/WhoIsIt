import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { User } from './user.entity';
import { GamePlayerRole } from '../enums';
import { PlayerSecret } from './player-secret.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';
import { Guess } from './guess.entity';
import { GameEvent } from './game-event.entity';
import { PlayerPanel } from './player-panel.entity';
import { Round } from './round.entity';

@Entity({ name: 'game_players' })
@Index('idx_game_players_game', ['game'])
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Game, (game: Game) => game.players, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @ManyToOne(() => User, (user: User) => user.gamePlayers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ type: 'text' })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({
    type: 'enum',
    enum: GamePlayerRole,
    enumName: 'game_player_role',
    default: GamePlayerRole.PLAYER,
  })
  role!: GamePlayerRole;

  @Column({ type: 'int', nullable: true })
  seatOrder?: number | null;

  @Column({ type: 'boolean', default: false })
  isReady!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  reconnectToken?: string | null;

  @Column({ type: 'text', nullable: true })
  lastSocketId?: string | null;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'int', nullable: true })
  placement?: number | null;

  @OneToOne(() => PlayerSecret, (secret: PlayerSecret) => secret.player)
  secret?: PlayerSecret;

  @OneToMany(() => Round, (round: Round) => round.activePlayer)
  activeRounds?: Round[];

  @OneToMany(() => Question, (question: Question) => question.askedBy)
  askedQuestions?: Question[];

  @OneToMany(() => Question, (question: Question) => question.targetPlayer)
  targetedQuestions?: Question[];

  @OneToMany(() => Answer, (answer: Answer) => answer.answeredBy)
  answers?: Answer[];

  @OneToMany(() => Guess, (guess: Guess) => guess.guessedBy)
  guesses?: Guess[];

  @OneToMany(() => Guess, (guess: Guess) => guess.targetPlayer)
  incomingGuesses?: Guess[];

  @OneToMany(() => GameEvent, (event: GameEvent) => event.actor)
  events?: GameEvent[];

  @OneToMany(() => PlayerPanel, (panel: PlayerPanel) => panel.player)
  panels?: PlayerPanel[];
}

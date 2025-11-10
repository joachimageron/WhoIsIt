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
import { User } from './user.entity';
import { CharacterSet } from './character-set.entity';
import { GameStatus, GameVisibility } from '../enums';
import { GamePlayer } from './game-player.entity';
import { GameInvite } from './game-invite.entity';
import { Round } from './round.entity';
import { GameEvent } from './game-event.entity';
import { GameConfigSnapshot } from './game-config-snapshot.entity';

@Entity({ name: 'games' })
@Index('ux_games_room_code', ['roomCode'], { unique: true })
@Index('idx_games_status', ['status'])
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  roomCode!: string;

  @ManyToOne(() => User, (user: User) => user.hostedGames, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'host_user_id' })
  host?: User | null;

  @ManyToOne(
    () => CharacterSet,
    (characterSet: CharacterSet) => characterSet.games,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'character_set_id' })
  characterSet!: CharacterSet;

  @Column({
    type: 'enum',
    enum: GameStatus,
    enumName: 'game_status',
    default: GameStatus.LOBBY,
  })
  status!: GameStatus;

  @Column({
    type: 'enum',
    enum: GameVisibility,
    enumName: 'game_visibility',
    default: GameVisibility.PRIVATE,
  })
  visibility!: GameVisibility;

  @Column({ type: 'int', nullable: true })
  turnTimerSeconds?: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  ruleConfig!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date | null;

  @ManyToOne(() => User, (user: User) => user.wonGames, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'winner_user_id' })
  winner?: User | null;

  @OneToMany(() => GamePlayer, (player: GamePlayer) => player.game)
  players?: GamePlayer[];

  @OneToMany(() => GameInvite, (invite: GameInvite) => invite.game)
  invites?: GameInvite[];

  @OneToMany(() => Round, (round: Round) => round.game)
  rounds?: Round[];

  @OneToMany(() => GameEvent, (event: GameEvent) => event.game)
  events?: GameEvent[];

  @OneToMany(
    () => GameConfigSnapshot,
    (snapshot: GameConfigSnapshot) => snapshot.game,
  )
  configSnapshots?: GameConfigSnapshot[];
}

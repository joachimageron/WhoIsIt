import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CharacterSet } from './character-set.entity';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';
import { PlayerStats } from './player-stats.entity';

@Entity({ name: 'users' })
@Index('idx_users_last_seen', ['lastSeenAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true, unique: true })
  email?: string | null;

  @Column({ type: 'text', nullable: false, unique: true })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  passwordHash?: string | null;

  @Column({ type: 'text', nullable: true })
  locale?: string | null;

  @Column({ type: 'boolean', default: false })
  isGuest!: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  verificationToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationTokenExpiresAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetTokenExpiresAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date | null;

  @OneToMany(
    () => CharacterSet,
    (characterSet: CharacterSet) => characterSet.createdBy,
  )
  characterSets?: CharacterSet[];

  @OneToMany(() => Game, (game: Game) => game.host)
  hostedGames?: Game[];

  @OneToMany(() => GamePlayer, (player: GamePlayer) => player.user)
  gamePlayers?: GamePlayer[];

  @OneToOne(() => PlayerStats, (stats) => stats.user)
  stats?: PlayerStats;
}

import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'player_stats' })
export class PlayerStats {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => User, (user: User) => user.stats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', default: 0 })
  gamesPlayed!: number;

  @Column({ type: 'int', default: 0 })
  gamesWon!: number;

  @Column({ type: 'int', default: 0 })
  totalQuestions!: number;

  @Column({ type: 'int', default: 0 })
  totalGuesses!: number;

  @Column({ type: 'int', nullable: true })
  fastestWinSeconds?: number | null;

  @Column({ type: 'int', default: 0 })
  streak!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

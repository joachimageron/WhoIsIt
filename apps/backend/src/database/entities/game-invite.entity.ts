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
import { GamePlayer } from './game-player.entity';

@Entity({ name: 'game_invites' })
@Index('ux_game_invites_code', ['inviteCode'], { unique: true })
export class GameInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Game, (game: Game) => game.invites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @Column({ type: 'text' })
  inviteCode!: string;

  @Column({ type: 'text', nullable: true })
  invitedEmail?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @ManyToOne(() => GamePlayer, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'accepted_by_player_id' })
  acceptedBy?: GamePlayer | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GamePlayer } from './game-player.entity';
import { Character } from './character.entity';
import { PlayerSecretStatus } from '../enums';

@Entity({ name: 'player_secrets' })
export class PlayerSecret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => GamePlayer, (player: GamePlayer) => player.secret, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_player_id' })
  player!: GamePlayer;

  @ManyToOne(() => Character, (character: Character) => character.secrets, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @Column({
    type: 'enum',
    enum: PlayerSecretStatus,
    enumName: 'player_secret_status',
    default: PlayerSecretStatus.HIDDEN,
  })
  status!: PlayerSecretStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revealedAt?: Date | null;
}

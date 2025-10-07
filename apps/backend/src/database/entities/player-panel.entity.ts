import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GamePlayer } from './game-player.entity';
import { Character } from './character.entity';
import { PlayerPanelStatus } from '../enums';

@Entity({ name: 'player_panels' })
export class PlayerPanel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.panels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_player_id' })
  player!: GamePlayer;

  @ManyToOne(() => Character, (character: Character) => character.panels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @Column({
    type: 'enum',
    enum: PlayerPanelStatus,
    enumName: 'player_panel_status',
    default: PlayerPanelStatus.UNKNOWN,
  })
  status!: PlayerPanelStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

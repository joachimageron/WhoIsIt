import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Round } from './round.entity';
import { GamePlayer } from './game-player.entity';
import { Character } from './character.entity';

@Entity({ name: 'guesses' })
export class Guess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Round, (round: Round) => round.guesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'round_id' })
  round!: Round;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.guesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'guessed_by_player_id' })
  guessedBy!: GamePlayer;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.incomingGuesses, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'target_player_id' })
  targetPlayer!: GamePlayer;

  @ManyToOne(() => Character, (character: Character) => character.guesses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'target_character_id' })
  targetCharacter!: Character;

  @Column({ type: 'boolean' })
  isCorrect!: boolean;

  @Column({ type: 'int', nullable: true })
  latencyMs?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  guessedAt!: Date;
}

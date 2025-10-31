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
import { CharacterSet } from './character-set.entity';
import { PlayerSecret } from './player-secret.entity';
import { PlayerPanel } from './player-panel.entity';
import { Guess } from './guess.entity';

@Entity({ name: 'characters' })
@Index('ux_characters_set_slug', ['set', 'slug'], { unique: true })
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CharacterSet, (set: CharacterSet) => set.characters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'set_id' })
  set!: CharacterSet;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => PlayerSecret, (secret: PlayerSecret) => secret.character)
  secrets?: PlayerSecret[];

  @OneToMany(() => PlayerPanel, (panel: PlayerPanel) => panel.character)
  panels?: PlayerPanel[];

  @OneToMany(() => Guess, (guess: Guess) => guess.targetCharacter)
  guesses?: Guess[];
}

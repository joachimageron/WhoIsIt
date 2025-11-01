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
import { Character } from './character.entity';
import { Game } from './game.entity';
import { GameConfigSnapshot } from './game-config-snapshot.entity';
import { GameVisibility } from '../enums';

@Entity({ name: 'character_sets' })
@Index('ux_character_sets_slug', ['slug'], { unique: true })
export class CharacterSet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ManyToOne(() => User, (user: User) => user.characterSets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;

  @Column({
    type: 'enum',
    enum: GameVisibility,
    default: GameVisibility.PRIVATE,
    enumName: 'game_visibility',
  })
  visibility!: GameVisibility;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Character, (character: Character) => character.set)
  characters?: Character[];

  @OneToMany(() => Game, (game: Game) => game.characterSet)
  games?: Game[];

  @OneToMany(
    () => GameConfigSnapshot,
    (snapshot: GameConfigSnapshot) => snapshot.characterSet,
  )
  configSnapshots?: GameConfigSnapshot[];
}

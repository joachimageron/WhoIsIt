import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { TraitValue } from './trait-value.entity';

@Entity({ name: 'character_trait_values' })
export class CharacterTraitValue {
  @PrimaryColumn({ type: 'uuid', name: 'character_id' })
  characterId!: string;

  @ManyToOne(() => Character, (character: Character) => character.traitValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @PrimaryColumn({ type: 'uuid', name: 'trait_value_id' })
  traitValueId!: string;

  @ManyToOne(
    () => TraitValue,
    (traitValue: TraitValue) => traitValue.characterLinks,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'trait_value_id' })
  traitValue!: TraitValue;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

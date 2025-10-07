import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trait } from './trait.entity';
import { CharacterTraitValue } from './character-trait-value.entity';

@Entity({ name: 'trait_values' })
@Index('idx_trait_values_sort', ['sortOrder'])
export class TraitValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Trait, (trait: Trait) => trait.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trait_id' })
  trait!: Trait;

  @Column({ type: 'text' })
  valueText!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(
    () => CharacterTraitValue,
    (characterTraitValue: CharacterTraitValue) =>
      characterTraitValue.traitValue,
  )
  characterLinks?: CharacterTraitValue[];
}

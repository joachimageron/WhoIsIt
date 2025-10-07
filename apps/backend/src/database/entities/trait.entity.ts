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
import { TraitValue } from './trait-value.entity';
import { TraitDataType } from '../enums';

@Entity({ name: 'traits' })
@Index('ux_traits_set_slug', ['set', 'slug'], { unique: true })
export class Trait {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CharacterSet, (set: CharacterSet) => set.traits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'set_id' })
  set!: CharacterSet;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  slug!: string;

  @Column({
    type: 'enum',
    enum: TraitDataType,
    enumName: 'trait_data_type',
  })
  dataType!: TraitDataType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => TraitValue, (value: TraitValue) => value.trait)
  values?: TraitValue[];
}

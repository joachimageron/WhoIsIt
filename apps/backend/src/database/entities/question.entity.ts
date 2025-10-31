import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Round } from './round.entity';
import { GamePlayer } from './game-player.entity';
import { QuestionCategory } from '../enums';
import { Answer } from './answer.entity';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Round, (round: Round) => round.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'round_id' })
  round!: Round;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.askedQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asked_by_player_id' })
  askedBy!: GamePlayer;

  @ManyToOne(
    () => GamePlayer,
    (player: GamePlayer) => player.targetedQuestions,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'target_player_id' })
  targetPlayer?: GamePlayer | null;

  @Column({ type: 'text' })
  questionText!: string;

  @Column({
    type: 'enum',
    enum: QuestionCategory,
    enumName: 'question_category',
  })
  category!: QuestionCategory;

  @CreateDateColumn({ type: 'timestamptz' })
  askedAt!: Date;

  @OneToMany(() => Answer, (answer: Answer) => answer.question)
  answers?: Answer[];
}

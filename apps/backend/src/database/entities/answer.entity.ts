import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { GamePlayer } from './game-player.entity';
import { AnswerValue } from '../enums';

@Entity({ name: 'answers' })
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Question, (question: Question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @ManyToOne(() => GamePlayer, (player: GamePlayer) => player.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'answered_by_player_id' })
  answeredBy!: GamePlayer;

  @Column({
    type: 'enum',
    enum: AnswerValue,
    enumName: 'answer_value',
  })
  answerValue!: AnswerValue;

  @Column({ type: 'text', nullable: true })
  answerText?: string | null;

  @Column({ type: 'int', nullable: true })
  latencyMs?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  answeredAt!: Date;
}

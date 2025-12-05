// src/schemas/subschemas/quest.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum QuestType {
  COMPLETE_QUIZZES = 'COMPLETE_QUIZZES',
  COMPLETE_GAMES = 'COMPLETE_GAMES',
  EARN_POINTS = 'EARN_POINTS',
  PERFECT_SCORE = 'PERFECT_SCORE',
}

export enum QuestStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CLAIMED = 'CLAIMED',
}

@Schema()
export class Quest extends Document {
  @Prop({ type: String, enum: Object.values(QuestType), required: true })
  type: QuestType;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ type: Number, required: true })
  target: number;

  @Prop({ type: Number, required: true })
  reward: number;

  @Prop({ type: String, enum: Object.values(QuestStatus), default: QuestStatus.ACTIVE })
  status: QuestStatus;

  @Prop({ type: Number, default: 1 })
  progressionLevel: number;

  @Prop()
  title?: string;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
export type QuestDocument = Quest;

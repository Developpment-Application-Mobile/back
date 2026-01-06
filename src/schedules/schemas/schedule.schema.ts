import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true })
  kidId: Types.ObjectId;

  @Prop({ required: true, enum: ['quiz', 'game', 'puzzle'] })
  activityType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  scheduledTime: Date;

  @Prop({ required: true, type: Number })
  duration: number; // in seconds

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: Date })
  completedAt?: Date;

  // Quiz-specific data
  @Prop({ type: Object })
  quizData?: {
    id: string;
    title: string;
    subject: string;
    difficulty: string;
    questions: any[];
  };

  // Game-specific data
  @Prop({ type: String })
  gameType?: string; // memoryMatch, colorMatch, etc.

  // Puzzle-specific data
  @Prop({ type: Object })
  puzzleData?: {
    id: string;
    title: string;
    description: string;
    isLocal: boolean;
  };

  @Prop({ type: Number })
  score?: number;

  @Prop({ type: Number })
  timeSpent?: number;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

// Indexes for better query performance
ScheduleSchema.index({ parentId: 1, kidId: 1 });
ScheduleSchema.index({ scheduledTime: 1 });
ScheduleSchema.index({ isCompleted: 1 });
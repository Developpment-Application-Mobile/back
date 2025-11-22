// ===== child.schema.ts - SIMPLE VERSION =====
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './quiz.schema';
import { Document } from 'mongoose';

@Schema()
export class Child extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  level: string;

  @Prop()
  avatarEmoji?: string;

  @Prop({ type: [QuizSchema], default: [] })
  quizzes: Quiz[];

  // ✅ Puzzles array - Simple Object approach with optional fields
  @Prop({ type: [Object], default: [] })
  puzzles: Array<{
    title: string;
    type: string;
    difficulty: string;
    gridSize: number;
    pieces: Array<{
      id: number;
      correctPosition: number;
      currentPosition: number;
      content: string;
      imageUrl?: string;
    }>;
    hint?: string;
    solution?: string;
    imageUrl?: string;
    isCompleted: boolean;
    attempts: number;
    timeSpent: number;
    score: number;
    completedAt?: Date | null;
  }>;

  @Prop({ default: 0 })
  Score: number;

  @Prop({ type: String })
  parentId?: string;
}

export const ChildSchema = SchemaFactory.createForClass(Child);


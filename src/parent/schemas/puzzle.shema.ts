import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PuzzlePiece {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  correctPosition: number;

  @Prop()
  currentPosition: number;

  @Prop()
  imageUrl: string;

  @Prop()
  content: string; // For word/number puzzles
}

@Schema({ timestamps: true })
export class Puzzle {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['image', 'word', 'number', 'sequence', 'pattern'] })
  type: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true })
  gridSize: number; // 2x2, 3x3, 4x4

  @Prop({ type: [PuzzlePiece] })
  pieces: PuzzlePiece[];

  @Prop()
  imageUrl: string; // For image puzzles

  @Prop()
  hint: string;

  @Prop()
  solution: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 0 })
  timeSpent: number; // in seconds

  @Prop({ default: 0 })
  score: number;

  @Prop()
  completedAt: Date;
}

export const PuzzleSchema = SchemaFactory.createForClass(Puzzle);
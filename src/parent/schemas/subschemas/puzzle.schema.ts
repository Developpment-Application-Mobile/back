import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false }) // Embedded document
export class PuzzlePiece {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  correctPosition: number;

  @Prop({ required: true })
  currentPosition: number;

  @Prop({ required: true })
  content: string;

  @Prop()
  imageUrl?: string;
}

export const PuzzlePieceSchema = SchemaFactory.createForClass(PuzzlePiece);

@Schema()
export class Puzzle {
  // Mongo will automatically add _id

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['image', 'word', 'number', 'sequence', 'pattern'] })
  type: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true })
  gridSize: number;

  @Prop({ type: [PuzzlePieceSchema], default: [] })
  pieces: PuzzlePiece[];

  @Prop()
  hint?: string;

  @Prop()
  solution?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 0 })
  timeSpent: number; // in seconds

  @Prop({ default: 0 })
  score: number;

  @Prop()
  completedAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PuzzleSchema = SchemaFactory.createForClass(Puzzle);
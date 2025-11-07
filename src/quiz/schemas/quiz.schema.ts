import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true })
  createdFor: Types.ObjectId; // The kid this quiz was generated for

  // Could be AI generated JSON structure
  @Prop({
    type: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
      },
    ],
    default: [],
  })
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];

  @Prop({ default: false })
  aiGenerated: boolean;

  @Prop()
  difficulty?: string; // e.g., easy, medium, hard
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

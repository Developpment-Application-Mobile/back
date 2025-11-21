import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema() // ✅ mark as embedded
export class Question {
  @Prop({ required: true })
  questionText: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ required: true })
  correctAnswerIndex: number;

  @Prop()
  userAnswerIndex?: number;

  @Prop()
  explanation?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  level: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

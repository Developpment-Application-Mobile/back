import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './question.schema';

@Schema() // ✅ mark as embedded
export class Quiz {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [QuestionSchema], default: [] })
  questions: Question[];


  @Prop({ default: false })
  isAnswered: boolean;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 0 })
  score: number;

  @Prop({ type: String }) // base64 QR code or a URL
  qrCode?: string;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

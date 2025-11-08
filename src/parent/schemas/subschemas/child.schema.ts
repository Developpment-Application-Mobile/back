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

  @Prop({ default: 0 })
  Score: number;
}

export const ChildSchema = SchemaFactory.createForClass(Child);

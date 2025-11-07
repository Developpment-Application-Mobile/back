import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Kid extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 4, max: 15 })
  age: number;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parent: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({
    type: [
      {
        quizId: { type: Types.ObjectId, ref: 'Quiz' },
        score: Number,
        dateTaken: Date,
      },
    ],
    default: [],
  })
  quizHistory: {
    quizId: Types.ObjectId;
    score: number;
    dateTaken: Date;
  }[];

  @Prop({ unique: true, index: true })
  qrCodeToken?: string;

  @Prop({ default: 0 })
  learningLevel: number;

  @Prop()
  avatarUrl?: string;
}

export const KidSchema = SchemaFactory.createForClass(Kid);

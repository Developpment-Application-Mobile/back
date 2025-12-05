// ===== child.schema.ts - SIMPLE VERSION =====
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './quiz.schema';
import { Quest, QuestSchema } from './quest.schema';
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

  @Prop({ default: 0 })
  lifetimeScore: number;

  @Prop({ default: 1 })
  progressionLevel: number;

  @Prop({ type: [Object], default: [] }) // Using Object for simplicity, or could use GiftSchema
  inventory: Array<{
    title: string;
    cost: number;
    purchasedAt: Date;
  }>;

  @Prop({ type: [Object], default: [] }) // Child-specific gift catalog
  shopCatalog: Array<{
    _id?: string;
    title: string;
    cost: number;
  }>;

  @Prop({ type: String })
  parentId?: string;

  @Prop({ type: [QuestSchema], default: [] })
  quests: Quest[];
}

export const ChildSchema = SchemaFactory.createForClass(Child);


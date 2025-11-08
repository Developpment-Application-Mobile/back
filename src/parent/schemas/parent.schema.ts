import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Child, ChildSchema } from './subschemas/child.schema';

export type ParentDocument = HydratedDocument<Parent>;

@Schema({ timestamps: true })
export class Parent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  profileImageUrl?: string;

  @Prop({ type: [ChildSchema], default: [] })
  children: Child[];

  @Prop({ default: 0 })
  totalScore: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);

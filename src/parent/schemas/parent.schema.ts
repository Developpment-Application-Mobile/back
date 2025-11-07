import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ParentDocument = HydratedDocument<Parent>;

@Schema({ timestamps: true })
export class Parent {
  _id: Types.ObjectId; // ✅ Explicitly type _id so TS knows it’s an ObjectId

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  // Relation: A parent can have multiple kids
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Kid' }], default: [] })
  kids: Types.ObjectId[];

  // Optional: parent profile fields
  @Prop()
  phone?: string;

  @Prop()
  avatarUrl?: string;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);

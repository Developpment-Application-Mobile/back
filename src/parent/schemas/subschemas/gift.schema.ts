import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Gift {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    cost: number;

    @Prop()
    id?: string; // Optional, can use _id from mongoose if embedded
}

export const GiftSchema = SchemaFactory.createForClass(Gift);

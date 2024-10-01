import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Otp {
  @Prop({
    type: Number,
    required: [true, 'Code is required'],
    index: true,
  })
  code: number;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
  })
  email: string;

  @Prop({
    type: Date,
    expires: 120,
  })
  createdAt?: Date;
}

export type IOtp = HydratedDocument<Otp>;
export const OtpSchema = SchemaFactory.createForClass(Otp);

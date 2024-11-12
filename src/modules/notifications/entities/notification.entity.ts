import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { FLAG } from '../enums/notification.enum';

@Schema()
class PayloadSchema {
  @Prop({
    type: String,
  })
  matchId: string;
}

@Schema({ timestamps: true })
export class Notification {
  // ==================== REQUIRED PARAMS ==========================

  @Prop({
    type: String,
    enum: ['user', 'admin'],
    required: [true, 'sender mode is required'],
  })
  senderMode: 'user' | 'admin';

  @Prop({
    type: String,
    enum: FLAG,
    required: [true, 'flag is required'],
  })
  flag: FLAG;

  @Prop({
    type: String,
    required: [true, 'message is required'],
  })
  message: string;

  @Prop({
    type: String,
    required: [true, 'title is required'],
  })
  title: string;

  // ==================== OPTIONAL PARAMS ==========================

  @Prop({
    type: PayloadSchema,
  })
  payload: PayloadSchema;

  @Prop({
    type: Boolean,
    default: false,
  })
  seen: boolean;

  // ==================== RELATIONAL PARAMS ==========================

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'sender is required'],
  })
  sender: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'receiver is required'],
  })
  receiver: Types.ObjectId;
}

export type INotification = HydratedDocument<Notification>;

export const NotificationSchema = SchemaFactory.createForClass(Notification);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ROLE } from 'src/modules/users/enums/user.enum';
import { FLAG } from '../enums/notification.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { Room } from 'src/modules/chat/entities/room.entity';

@Schema()
class PayloadSchema {
  @Prop({
    type: Types.ObjectId,
    ref: Room.name,
  })
  room: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Notification {
  // ==================== REQUIRED PARAMS ==========================

  @Prop({
    type: String,
    enum: ROLE,
    required: [true, 'sender mode is required'],
  })
  senderMode: ROLE;

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

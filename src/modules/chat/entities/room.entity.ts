import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IUser, User } from 'src/modules/users/entities/user.entity';
import { REFERENCE } from '../enums/chat.enum';

@Schema()
class LastMessage {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  from: IUser;

  @Prop({ type: String })
  message: string;
}

const LastMessageSchema = SchemaFactory.createForClass(LastMessage);

@Schema()
class RoomUser {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: IUser;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;
}

const RoomUserSchema = SchemaFactory.createForClass(RoomUser);

@Schema({ timestamps: true })
class Room {
  @Prop({
    type: [RoomUserSchema],
    default: [],
  })
  users: RoomUser[];

  @Prop({ type: LastMessageSchema, default: null })
  lastMessage: LastMessage;

  @Prop({
    type: String,
    enum: REFERENCE,
    default: REFERENCE.ONE_TO_ONE,
  })
  reference: REFERENCE;

  @Prop({ type: Date, default: Date.now() })
  lastChatted: Date;
}

const RoomSchema = SchemaFactory.createForClass(Room);
type IRoom = HydratedDocument<Room>;

RoomSchema.pre(['findOne', 'findOneAndUpdate'], function () {
  this.populate({
    path: 'users.user',
    select:
      '_id id firstName lastName socketIds fcmTokens isOnline inAppNotifications pushNotifications',
  });
});

RoomSchema.pre('save', function () {
  this.populate({
    path: 'users.user',
    select:
      '_id id firstName lastName socketIds fcmTokens isOnline inAppNotifications pushNotifications',
  });
});

export { IRoom, Room, RoomSchema, RoomUser };

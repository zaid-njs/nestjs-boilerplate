import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { IUser, User } from 'src/modules/users/entities/user.entity';
import { Room } from './room.entity';

@Schema({ timestamps: true })
class Chat extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Room.name,
    required: true,
  })
  room: Room;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  from: IUser;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    default: [],
  })
  to: IUser[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    default: [],
  })
  deliveredTo: IUser[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    default: [],
  })
  readBy: IUser[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    default: [],
  })
  deletedBy: IUser[];

  @Prop({ type: String, default: null })
  message: string;

  @Prop({ type: Boolean, default: false })
  isForwarded: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Chat.name, default: null })
  replyTo: IChat;
}

const ChatSchema = SchemaFactory.createForClass(Chat);
type IChat = HydratedDocument<Chat>;

ChatSchema.pre('find', function () {
  this.populate('replyTo');
  this.populate('from');
});

export { Chat, ChatSchema, IChat };

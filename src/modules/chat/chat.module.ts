import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Room, RoomSchema } from './entities/room.entity';
import { SocketsGateway } from './sockets.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, SocketsGateway],
  exports: [ChatService, SocketsGateway],
})
export class ChatModule {}

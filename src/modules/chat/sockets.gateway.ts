import { forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { bgGreen, italic, red } from 'cli-color';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { IUser, User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { Chat, IChat } from './entities/chat.entity';
import { IRoom, Room } from './entities/room.entity';

@WebSocketGateway()
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel(User.name) private readonly User: Model<IUser>,
    @InjectModel(Room.name) private readonly Room: Model<IRoom>,
    @InjectModel(Chat.name) private readonly Chat: Model<IChat>,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    console.log(bgGreen('CHAT SOCKET GATEWAY INITIALIZED'));
  }

  // when user joins the app
  @SubscribeMessage('join')
  async handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    try {
      if (!payload?.id)
        throw new Error(italic(red('Socket Error: Payload is empty')));

      const { socketIds } = await this.User.findOne({
        _id: payload?.id,
      }).select('socketIds');
      await Promise.all([
        this.User.findByIdAndUpdate(payload.id, {
          socketIds: [
            ...socketIds.filter((id) => this.server.sockets.sockets.has(id)),
            client.id,
          ],
          isOnline: true,
        }),
        this.Chat.updateMany(
          { to: payload.id },
          { $addToSet: { deliveredTo: payload.id } },
        ),
      ]);

      // fire chat-delivered event for all rooms
      const rooms = await this.Room.find({ 'users.user': payload.id }).select(
        '_id',
      );
      const roomIds = rooms.map((room) => room._id.toHexString());

      if (roomIds.length > 0)
        client.broadcast.to(roomIds).emit('chat-delivered', { id: payload.id });

      console.log(italic(`User Connected: ${payload.id}`));
    } catch (error) {
      console.log(error.message);
    }
  }

  // when user disconnects with the app
  @SubscribeMessage('disconnecting')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const user = await this.User.findOneAndUpdate(
        { socketIds: client.id },
        { $pull: { socketIds: client.id } },
        { new: true },
      );
      if (user?.socketIds?.length === 0) {
        user.isOnline = false;
        await user.save();
      }
      if (!!user) console.log(italic(`User Disconnected: ${user?.id}`));
    } catch (error) {
      console.log(error.message);
    }
  }

  @SubscribeMessage('join-room')
  async handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      if (!payload.roomId)
        throw new Error(italic(red('Socket Error: Payload is empty')));

      client.join(payload.roomId);

      const user = await this.User.findOne({ socketIds: client.id });

      await this.Chat.updateMany(
        { to: user._id.toHexString() },
        { $addToSet: { readBy: user._id.toHexString() } },
      );

      await this.Room.findByIdAndUpdate(
        payload.roomId,
        {
          'users.$[elem].unreadCount': 0,
        },
        {
          arrayFilters: [{ 'elem.user': user._id.toHexString() }],
        },
      );

      client.broadcast
        .to(payload.roomId)
        .emit('chat-read', { id: user._id.toHexString() });
    } catch (error) {
      console.log(error.message);
    }
  }

  @SubscribeMessage('leave-room')
  async handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      if (!payload.roomId)
        throw new Error(italic(red('Socket Error: Payload is empty')));

      client.leave(payload.roomId);
    } catch (error) {
      console.log(error.message);
    }
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; message: string },
  ) {
    try {
      const from = await this.User.findOne({ socketIds: client.id }).select(
        '_id firstName lastName',
      );
      let room: IRoom = await this.Room.findById(payload.roomId);

      if (!room || !from)
        throw new Error(italic(red('Socket Error: Room or Sender not found')));

      const messageData = await this.chatService.sendMessage({
        roomId: payload.roomId,
        message: payload.message,
        from: from._id.toHexString(),
        client,
      });
      room = messageData.room;

      // fire the new room socket event
      const socketIds = room.users.reduce((acc, roomUser) => {
        if (roomUser.user._id.toHexString() !== from._id.toHexString()) {
          acc.push(...roomUser.user.socketIds);
        }
        return acc;
      }, []);

      if (socketIds.length > 0)
        client.broadcast.to(socketIds).emit('new-room', { room });

      return { chat: messageData.chat };
    } catch (error) {
      console.log(error.message);
    }
  }
}

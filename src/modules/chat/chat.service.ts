import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Socket } from 'socket.io';
import { pagination } from 'src/common/utils/types.util';
import { FLAG } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { IUser, User } from '../users/entities/user.entity';
import { ROLE } from '../users/enums/user.enum';
import { Chat, IChat } from './entities/chat.entity';
import { IRoom, Room, RoomUser } from './entities/room.entity';
import { REFERENCE } from './enums/chat.enum';
import { SocketsGateway } from './sockets.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(User.name) private readonly User: Model<IUser>,
    @InjectModel(Room.name) private readonly Room: Model<IRoom>,
    @InjectModel(Chat.name) private readonly Chat: Model<IChat>,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socket: SocketsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getRooms(
    user: IUser,
    query: { search: string },
    pagination: pagination,
  ): Promise<{ rooms: IRoom[]; totalCount: number }> {
    const aggregation = [
      {
        $match: {
          'users.user': new mongoose.Types.ObjectId(user.id),
        },
      },
      {
        $unwind: {
          path: '$users',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'users.user',
          foreignField: '_id',
          as: 'users.user',
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                isOnline: 1,
                lastSeen: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$users.user',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: '$_id',
          users: {
            $push: '$users',
          },
          lastMessage: {
            $first: '$lastMessage',
          },
          reference: {
            $first: '$reference',
          },
          lastChatted: {
            $first: '$lastChatted',
          },
          createdAt: {
            $first: '$createdAt',
          },
        },
      },
      {
        $match: {
          ...(!!query.search && {
            $or: [
              {
                'users.user.firstName': {
                  $regex: query.search,
                  $options: 'i',
                },
              },
              {
                'users.user.lastName': {
                  $regex: query.search,
                  $options: 'i',
                },
              },
            ],
          }),
        },
      },
      {
        $count: 'totalCount',
      },
    ];

    const aggregationWithPagination = [
      ...aggregation.slice(0, -1),
      {
        $sort: { lastChatted: -1 } as { [key: string]: -1 | 1 },
      },
      {
        $skip: pagination.skip,
      },
      {
        $limit: pagination.limit,
      },
    ];

    const [data] = await this.Room.aggregate([
      {
        $facet: {
          rooms: aggregationWithPagination,
          totalCount: aggregation,
        },
      },
    ]);

    return {
      rooms: data.rooms,
      totalCount: data.totalCount[0]?.totalCount || 0,
    };
  }

  async chatMessages(user: IUser, room: string, pagination: pagination) {
    if (!room) throw new NotFoundException('Room Id is missing');

    const dbQuery = {
      $or: [{ from: user._id.toHexString() }, { to: user._id.toHexString() }],
      room: room,
    };

    const [messages, totalCount] = await Promise.all([
      this.Chat.find(dbQuery)
        .sort('createdAt')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      this.Chat.countDocuments(dbQuery),
    ]);

    return { messages: messages as IChat[], totalCount };
  }

  async startChat(
    payload: {
      users: string[];
      reference?: REFERENCE;
      message?: string;
    },
    user: IUser,
  ): Promise<IRoom> {
    let room: IRoom;

    room = await this.Room.findOne({
      users: {
        $all: [
          {
            $elemMatch: { user: user.id },
          },
          ...payload.users.map((user) => {
            return {
              $elemMatch: { user },
            };
          }),
        ],
      },
      reference: REFERENCE.ONE_TO_ONE,
    });

    if (!room) {
      room = await this.createRoom({
        reference: payload?.reference,
        users: [...payload.users, user.id],
      });
    }

    if (payload.message) {
      const messageData = await this.sendMessage({
        roomId: room.id,
        from: user.id,
        message: payload.message,
      });
      room = messageData.room;
    }

    // fire the new room socket event
    const socketIds = room.users.reduce((acc, roomUser) => {
      if (roomUser.user._id.toHexString() !== user.id) {
        acc.push(...roomUser.user.socketIds);
      }
      return acc;
    }, []);

    if (socketIds.length > 0)
      this.socket.server.to(socketIds).emit('new-room', { room });

    return room as IRoom;
  }

  async createRoom(payload: {
    reference?: REFERENCE;
    users: string[];
  }): Promise<IRoom> {
    const room = await this.Room.create({
      users: payload.users.map((user) => {
        return { user: new mongoose.Types.ObjectId(user) };
      }),
      reference: payload?.reference,
    });

    return room;
  }

  async joinRoom(user: User, roomId: string) {
    if (!roomId) throw new NotFoundException('Room Id not found');
  }

  async leaveRoom(user: User, roomId: string) {}

  async endRoom(roomId: string) {}

  async sendMessage(payload: {
    roomId: string;
    from: string;
    message: string;
    client?: Socket;
  }): Promise<{ room: IRoom; chat: IChat }> {
    const { roomId, from, message } = payload;

    let room = await this.Room.findById(roomId).lean();

    const to = this.getReceiverIds(room.users, from);

    const deliveredTo = this.getOnlineUsers(room.users);
    const readBy = this.getInChatUsers(room.users, roomId);

    const chat = await this.Chat.create({
      room: roomId,
      from,
      message: message,
      to,
      deliveredTo,
      readBy,
    });

    await chat.populate(['from', 'to']);

    room = await this.Room.findByIdAndUpdate(
      roomId,
      {
        lastMessage: { from, message },
        lastChatted: new Date(),
        $inc: { 'users.$[elem].unreadCount': 1 },
      },
      {
        new: true,
        arrayFilters: [
          { 'elem.user': { $in: to.filter((id) => !readBy.includes(id)) } },
        ],
      },
    ).lean();

    if (payload.client && roomId) {
      payload.client.broadcast.to(roomId).emit('chat-message', { chat });
    }

    await Promise.all(
      chat.to.map((toUser) => {
        return this.notificationsService.createNotification({
          senderMode: 'user',
          from: new Types.ObjectId(from),
          to: toUser,
          title: 'New Message',
          message: `${chat.from.firstName + '' + chat.from.lastName} send you a message`,
          flag: FLAG.CHAT,
          payload: { room: roomId },
        });
      }),
    );

    return { room, chat };
  }

  async getAdminId() {
    const admin = await this.User.findOne({ role: ROLE.ADMIN }).lean();
    return admin._id;
  }

  getReceiverIds(roomUsers: RoomUser[], from: string): string[] {
    return roomUsers
      .filter((roomUser) => roomUser.user._id.toHexString() !== from)
      .map((roomUser) => roomUser.user._id.toHexString());
  }

  getOnlineUsers(roomUsers: RoomUser[]): string[] {
    return roomUsers
      .filter((roomUser) => roomUser.user.isOnline)
      .map((roomUser) => roomUser.user._id.toHexString());
  }

  getInChatUsers(roomUsers: RoomUser[], roomId: string): string[] {
    const socketIds = this.getSocketIdsInRoom(roomId);
    return roomUsers
      .filter((roomUser) =>
        roomUser.user.socketIds.some((socketId) =>
          socketIds.includes(socketId),
        ),
      )
      .map((roomUser) => roomUser.user._id.toHexString());
  }

  getSocketIdsInRoom(room: string): string[] {
    const roomSockets = this.socket.server.sockets.adapter.rooms.get(room);
    if (roomSockets) {
      return Array.from(roomSockets);
    }
    return [];
  }
}

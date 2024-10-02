import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as admin from 'firebase-admin';
import moment from 'moment';
import { Model } from 'mongoose';
import { pagination } from 'src/common/utils/types.util';
import { IUser } from '../users/entities/user.entity';
import { ConfigService } from './../../config/config.service';
import { INotification, Notification } from './entities/notification.entity';
import { notification } from './interfaces/notification.interface';
import { NotificationSocketsGateway } from './notification-sockets.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly Notification: Model<INotification>,
    private readonly socket: NotificationSocketsGateway,
    private readonly configService: ConfigService,
  ) {}

  // ==================== GET SERVICE ==========================

  async getNotifications(
    user: IUser,
    pagination: pagination,
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
    totalCount: number;
  }> {
    // sending notification
    const [totalCount, unreadCount, newNotifications] = await Promise.all([
      this.Notification.countDocuments({
        receiver: user._id,
      }),

      this.Notification.countDocuments({
        receiver: user._id,
        seen: false,
      }),

      this.Notification.find({
        receiver: user._id,
        // createdAt: { $gte: user.lastLogin },
      })
        .populate('sender', 'firstName lastName image')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
    ]);

    return {
      notifications: (newNotifications as INotification[]) || [],
      unreadCount,
      totalCount,
    };
  }

  // ==================== PATCH SERVICE ==========================

  async seenNotifications(params: {
    user: IUser;
    notificationId?: string;
  }): Promise<{ notifications: INotification[]; unseenCount: number }> {
    const { user, notificationId } = params;
    const dbQuery = { receiver: user._id };

    if (!!notificationId) dbQuery['_id'] = notificationId;

    await this.Notification.updateMany(dbQuery, { $set: { seen: true } });

    const [unseenCount, notifications] = await Promise.all([
      this.Notification.countDocuments({ receiver: user._id, seen: false }),
      this.Notification.find({ receiver: user._id, seen: true }).lean(),
    ]);

    return { notifications: notifications as INotification[], unseenCount };
  }

  // ==================== DELETE SERVICE ==========================

  async deleteNotifications(params: { find: object }): Promise<void> {
    const { find } = params;
    await this.Notification.deleteMany(find);
  }

  // ==================== HELPER SERVICE ==========================

  async createNotification(notification: notification): Promise<void> {
    const { senderMode, receiver, title, message, socket, receiverUser } =
      notification;

    if (receiverUser.inAppNotifications) {
      const _notification = await this.Notification.create({
        ...notification,
        createdAt: moment().utc().toDate(),
      });

      if (!!socket && socket.length > 0) {
        await this.socket.server.to(socket).emit('new-notification', {
          senderMode,
          // sender: senderUser,
          receiver,
          title,
          message,
          notification: _notification,
        });
      }
    }

    if (receiverUser.pushNotifications) this.sendPushNotification(notification);
  }

  // ==================== PUSH NOTIFICATION SERVICE ==========================

  async sendPushNotification(notification: notification): Promise<void> {
    const { title, message, fcmToken, receiverUser } = notification;

    if (fcmToken?.length > 0 && receiverUser?.pushNotifications) {
      const imageUrl = `${this.configService.get(
        'API_HOSTED_URL',
      )}images/logo.png`;

      admin
        .messaging()
        .sendEachForMulticast({
          notification: {
            title: title || 'Pet Commute',
            body: message,
            imageUrl,
          },
          tokens: fcmToken,
        })
        .then(() => console.log('notification sent!'));
    }
  }
}

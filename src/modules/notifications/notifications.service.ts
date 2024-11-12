import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Model, Types } from 'mongoose';
import { pagination } from 'src/common/utils/types.util';
import { IUser } from '../users/entities/user.entity';
import { INotification, Notification } from './entities/notification.entity';
import { FLAG } from './enums/notification.enum';
import { NotificationSocketsGateway } from './notification-sockets.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly Notifications: Model<INotification>,
    private readonly socket: NotificationSocketsGateway,
  ) {}

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
      this.Notifications.countDocuments({
        receiver: user._id,
      }),

      this.Notifications.countDocuments({
        receiver: user._id,
        seen: false,
      }),

      this.Notifications.find({
        receiver: user._id,
      })
        .populate('sender', 'firstName lastName socketIds photo')
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

  async seenNotifications(params: {
    user: IUser;
    notificationId?: string;
  }): Promise<{ notifications: INotification[]; unseenCount: number }> {
    const { user, notificationId } = params;

    const dbQuery = { receiver: user._id };
    if (!!notificationId) dbQuery['_id'] = notificationId;

    await this.Notifications.updateMany(dbQuery, { $set: { seen: true } });

    const [unseenCount, notifications] = await Promise.all([
      this.Notifications.countDocuments({
        receiver: user._id,
        seen: false,
      }),
      this.Notifications.find({ receiver: user._id, seen: true }).lean(),
    ]);

    return { notifications: notifications as INotification[], unseenCount };
  }

  // ==================== HELPER SERVICE ==========================

  /**
   * Sends a notification to the specified user. If the sender mode is `admin`, the
   * notification will be sent from the admin user. If the sender mode is `user`, the
   * notification will be sent from the specified user.
   *
   * @param notification The notification data to send.
   * @param notification.senderMode The sender mode of the notification.
   * @param notification.from The sender of the notification.
   * @param notification.to The receiver of the notification.
   * @param notification.title The title of the notification.
   * @param notification.message The message of the notification.
   * @param notification.flag The flag of the notification. If not provided, it will be
   * `FLAG.NONE`.
   * @param notification.payload The payload of the notification. If not provided, it will
   * be an empty object.
   */
  async createNotification(notification: {
    senderMode: 'admin' | 'user';
    from: Types.ObjectId;
    to: IUser;
    title: string;
    message: string;
    flag?: FLAG;
    payload?: object;
  }) {
    const { from, to } = notification;

    if (!notification.flag) {
      notification.flag = FLAG.NONE;
      notification.payload = {};
    }

    if (from.toString() === to._id.toString()) return;

    const data = await this.Notifications.create({
      ...notification,
      sender: notification.from,
      receiver: notification.to._id,
      createdAt: moment().utc().toDate(),
    });

    this.socket.server.to(to.socketIds).emit('new-notification', data);
    return;
  }

  // async createNotification(notification: notification): Promise<void> {
  //   const {
  //     senderMode,
  //     receiver,
  //     title,
  //     message,
  //     socket,
  //     receiverUser,
  //     sender,
  //   } = notification;

  //   if (receiverUser.inAppNotifications) {
  //     const _notification = await this.Notifications.create({
  //       ...notification,
  //       createdAt: moment().utc().toDate(),
  //     });

  //     if (!!socket && socket.length > 0) {
  //       this.socket.server.to(socket).emit('new-notification', {
  //         senderMode,
  //         sender,
  //         receiver,
  //         title,
  //         message,
  //         notification: _notification,
  //       });
  //     }
  //   }

  //   // if (receiverUser.pushNotifications) this.sendPushNotification(notification);
  // }

  // ==================== PUSH NOTIFICATION SERVICE ==========================

  // async sendPushNotification(notification: notification): Promise<void> {
  //   const { title, message, fcmToken, receiverUser } = notification;

  //   if (fcmToken?.length > 0 && receiverUser?.pushNotifications) {
  //     const imageUrl = `${this.configService.get(
  //       'API_HOSTED_URL',
  //     )}images/logo.png`;

  //     admin
  //       .messaging()
  //       .sendEachForMulticast({
  //         notification: {
  //           title: title || 'Next Generation',
  //           body: message,
  //           imageUrl,
  //         },
  //         tokens: fcmToken,
  //       })
  //       .then(() => console.log('notification sent!'));
  //   }
  // }
}

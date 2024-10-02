import { Types } from 'mongoose';
import { FLAG } from '../enums/notification.enum';

type receiverUser = { pushNotifications: boolean; inAppNotifications: boolean };
type payload = { room?: string };

export type notification = {
  senderMode: string;
  receiver: string;
  sender?: string;
  receiverUser: receiverUser;
  title: string;
  message: string;
  fcmToken: string[];
  socket: string[];
  payload?: payload;
  flag?: FLAG;
};

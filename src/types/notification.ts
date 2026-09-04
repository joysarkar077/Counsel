import { Document, Types } from 'mongoose';

export type NotificationCategory = 'case_update' | 'assignment' | 'message' | 'system';

export interface INotification extends Document {
  userId: string;
  title_enc: string;
  message_enc: string;
  category: NotificationCategory;
  read: boolean;
  actionUrl_enc?: string;
  createdAt: Date;
}

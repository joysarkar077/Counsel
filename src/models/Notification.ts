import mongoose, { Model, Schema } from 'mongoose';
import type { INotification } from '@/types/notification';

export type { INotification };

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  title_enc: { type: String, required: true },
  message_enc: { type: String, required: true },
  category: {
    type: String,
    enum: ['case_update', 'assignment', 'message', 'system'],
    required: true
  },
  read: { type: Boolean, default: false },
  actionUrl_enc: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

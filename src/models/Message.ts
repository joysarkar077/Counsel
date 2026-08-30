import mongoose, { Model, Schema } from 'mongoose';
import type { IMessage } from '@/types/message';

export type { IMessage };

const MessageSchema = new Schema<IMessage>({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ciphertext: { type: String, required: true },
  signature: { type: String, required: true },
  integrityHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index to optimize queries for fetching messages by case chronologically
MessageSchema.index({ caseId: 1, createdAt: 1 });

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

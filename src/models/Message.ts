import mongoose, { Model, Schema } from 'mongoose';
import type { IMessage } from '@/types/message';

export type { IMessage };

const MessageSchema = new Schema<IMessage>({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ciphertext: { type: String, required: true },
  integrityHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index to optimize queries for fetching messages by case chronologically
MessageSchema.index({ caseId: 1, createdAt: 1 });

// Prevent Mongoose from caching the old schema during hot-reloads.
// Without this, changes to the schema (e.g. removing a required field) are
// ignored in development because mongoose.models.Message already holds the
// previously compiled model. Matches the same pattern used in User.ts and Case.ts.
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);


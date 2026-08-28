import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  role: 'lawyer' | 'admin';
  caseId?: string;
  tokenHash: string;
  invitedBy: string; // userId of the admin who sent it
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

const InvitationSchema: Schema = new Schema({
  email: { type: String, required: true },
  role: { type: String, enum: ['lawyer', 'admin'], required: true },
  caseId: { type: String },
  tokenHash: { type: String, required: true, unique: true },
  invitedBy: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ||
  mongoose.model<IInvitation>('Invitation', InvitationSchema);

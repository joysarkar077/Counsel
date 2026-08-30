import { Document } from 'mongoose';

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

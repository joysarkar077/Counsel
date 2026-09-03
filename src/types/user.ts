import { Document } from 'mongoose';

export interface IUser extends Document {
  username_enc: string;
  emailHash: string;
  email_enc: string;
  contact_enc: string;
  passwordHash: string;
  salt: string;
  publicKey: string;
  encryptedPrivateKey: string;
  role: 'client' | 'lawyer' | 'admin' | 'super_admin';
  isActive: boolean;
  otpHash?: string;
  otpExpiresAt?: Date;
  position?: string;
  employeeId?: string;
  department?: string;
  casesHandled?: number;
  activeCases?: number;
  successRate?: string;
  joinDate?: Date;
  address_enc?: string;
  bloodGroup_enc?: string;
  avatarUrl?: string;
  avatarKey_enc?: string;
  createdAt: Date;
}

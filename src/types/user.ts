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
  createdAt: Date;
}

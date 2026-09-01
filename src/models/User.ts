import mongoose, { Model, Schema } from 'mongoose';
import type { IUser } from '@/types/user';

export type { IUser };

const UserSchema: Schema = new Schema({
  username_enc: {
    type: String,
    required: true,
  },
  emailHash: {
    type: String,
    required: true,
    unique: true,
  },
  email_enc: {
    type: String,
    required: true,
  },
  contact_enc: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
  },
  encryptedPrivateKey: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['client', 'lawyer', 'admin', 'super_admin'],
    default: 'client',
  },
  isActive: {
    type: Boolean,
    default: true, // false for invited users until they accept
  },
  otpHash: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

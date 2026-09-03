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
  position: { type: String },
  employeeId: { type: String },
  department: { type: String },
  casesHandled: { type: Number, default: 0 },
  activeCases: { type: Number, default: 0 },
  successRate: { type: String },
  joinDate: { type: Date },
  address_enc: { type: String },
  bloodGroup_enc: { type: String },
  avatarUrl: { type: String },
  avatarKey_enc: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent mongoose from caching the old schema during hot-reloads
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  username_enc: string;
  email_enc: string;
  contact_enc: string;
  passwordHash: string;
  salt: string;
  publicKey: string;
  encryptedPrivateKey: string;
  role: 'client' | 'lawyer' | 'admin' | 'super_admin';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username_enc: {
    type: String,
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

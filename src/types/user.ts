import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName?: string;
  username_enc: string;
  emailHash: string;
  email_enc: string;
  contact_enc: string;
  passwordHash: string;
  salt: string;
  /** ECC secp256k1 public key in 'x,y' hex format — used for ECIES data encryption */
  publicKey: string;
  /** ECC secp256k1 private key scalar as hex — used for ECIES decryption */
  encryptedPrivateKey: string;
  /** RSA-2048 public key as JSON { e, n } hex — used for RSA digital signatures */
  rsaPublicKey?: string;
  /** RSA-2048 private key scalar d as hex — used for RSA signing */
  rsaPrivateKey?: string;
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

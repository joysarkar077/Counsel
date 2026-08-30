import { Document, Types } from 'mongoose';

export interface IMessage extends Document {
  caseId: Types.ObjectId;
  senderId: Types.ObjectId;
  ciphertext: string; // ECIES ciphertext containing encrypted message + potentially IV/ephemeral key
  signature: string; // ECDSA signature for non-repudiation
  integrityHash: string; // HMAC for tamper evidence
  createdAt: Date;
}

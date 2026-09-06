import { Document, Types } from 'mongoose';

export interface IMessage extends Document {
  caseId: Types.ObjectId;
  senderId: Types.ObjectId;
  ciphertext: string; // ECIES ciphertext containing the encrypted message bundle
  integrityHash: string; // HMAC-SHA256 over the ciphertext field for tamper detection
  createdAt: Date;
}

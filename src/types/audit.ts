import { Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  actorBlindIndex: string; // HMAC of user email/ID for queryability without exposing plaintext ID
  action: string;
  ipHash: string; // Hashed IP address
  details_enc?: string;
  hash: string; // SHA-256(prevHash + timestamp + action + actorBlindIndex + ...)
  prevHash: string; // Hash of the immediately preceding audit log
}

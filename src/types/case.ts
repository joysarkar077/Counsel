import { Document, Types } from 'mongoose';

/** Valid states in the case lifecycle state machine. */
export type CaseStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'CLOSE_REQUESTED'
  | 'CLOSED'
  | 'REJECTED';

export interface ITimelineEvent {
  timestamp: Date;
  action: string;
  actorId: string;
}

export interface IAccessKey {
  userId: string;
  encryptedCaseKey: string; // The AES-256 case key encrypted with this user's RSA public key
}

export interface ICase extends Document {
  caseId: string;
  /** MongoDB ObjectId of the client who submitted the case */
  clientId: string;
  /** ECIES-encrypted case title */
  title_enc: string;
  /** ECIES-encrypted case description */
  description_enc: string;
  /** ECIES-encrypted opposing party name (for conflict checks) */
  opposingParty_enc: string;
  /** ECIES-encrypted estimated claim value */
  claimValue_enc?: string;
  /** ECIES-encrypted category for routing (e.g. Family, Criminal) */
  category_enc: string;
  /** ECIES-encrypted urgency for triaging */
  urgency_enc: string;
  /** ECIES-encrypted jurisdiction/district for routing */
  jurisdiction_enc: string;
  /** Comma-separated list of lawyer ObjectIds assigned to this case */
  lawyerIds: string[];
  /** Array of encrypted AES Case Keys, wrapped by each authorized user's RSA Public Key */
  accessKeys: IAccessKey[];
  status: CaseStatus;
  timeline: ITimelineEvent[];
  /** HMAC fingerprint for tamper detection (populated by hmac.ts) */
  hmac: string;
  createdAt: Date;
  updatedAt: Date;
}

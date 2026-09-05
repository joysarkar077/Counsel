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
  /**
   * JSON-serialised ECIESCiphertext bundle containing the case ECC private scalar,
   * encrypted to this user's ECC public key. Decrypt with the user's ECIES private key
   * to obtain the case private scalar, which can then decrypt all *_enc fields.
   */
  encryptedCaseKey: string;
}

export interface ICase extends Document {
  caseId: string;
  /** MongoDB ObjectId of the client who submitted the case */
  clientId: string;
  /**
   * Per-case ECC secp256k1 public key in 'x,y' hex format.
   * All *_enc fields are ECIES-encrypted to this public key.
   * The corresponding private scalar is distributed via accessKeys[].
   */
  casePublicKey: string;
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
  /** JSON-stringified and encrypted array of hearing dates/details */
  hearingDates_enc?: string;
  /** JSON-stringified and encrypted array of juror details */
  jurors_enc?: string;
  /** JSON-stringified and encrypted DA information */
  da_enc?: string;
  /** JSON-stringified and encrypted Judge information */
  judge_enc?: string;
  /** JSON-stringified and encrypted array of investigation officers */
  officers_enc?: string;
  /** JSON-stringified and encrypted array of witnesses */
  witnesses_enc?: string;
  /** JSON-stringified and encrypted array of exhibits */
  exhibits_enc?: string;
  /** JSON-stringified and encrypted case updates/notes */
  caseUpdates_enc?: string;
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

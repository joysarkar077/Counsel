import mongoose, { Model, Schema } from 'mongoose';
import type { ICase, ITimelineEvent } from '@/types/case';

export type { ICase };

const TimelineEventSchema = new Schema<ITimelineEvent>({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  actorId: { type: String, required: true }
}, { _id: false });

const AccessKeySchema = new Schema({
  userId: { type: String, required: true },
  /** ECIES bundle of the case ECC private scalar, encrypted to this user's ECC public key */
  encryptedCaseKey: { type: String, required: true },
}, { _id: false });

const CaseSchema = new Schema<ICase>({
  caseId: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  /** ECC secp256k1 public key 'x,y' hex for this case — used to encrypt all *_enc fields */
  casePublicKey: { type: String, required: true },
  title_enc: { type: String, required: true },
  description_enc: { type: String, required: true },
  opposingParty_enc: { type: String, required: true },
  claimValue_enc: { type: String, required: false },
  category_enc: { type: String, required: true },
  urgency_enc: { type: String, required: true },
  jurisdiction_enc: { type: String, required: true },
  hearingDates_enc: { type: String, required: false },
  jurors_enc: { type: String, required: false },
  da_enc: { type: String, required: false },
  judge_enc: { type: String, required: false },
  officers_enc: { type: String, required: false },
  witnesses_enc: { type: String, required: false },
  exhibits_enc: { type: String, required: false },
  caseUpdates_enc: { type: String, required: false },
  lawyerIds: { type: [String], default: [] },
  accessKeys: { type: [AccessKeySchema], default: [] },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'ACTIVE', 'CLOSE_REQUESTED', 'CLOSED', 'REJECTED'],
    default: 'PENDING_REVIEW',
  },
  timeline: { type: [TimelineEventSchema], default: [] },
  hmac: { type: String, required: true },
}, { timestamps: true });

// Prevent mongoose from caching the old schema during hot-reloads
if (mongoose.models.Case) {
  delete mongoose.models.Case;
}

export const Case: Model<ICase> = mongoose.model<ICase>('Case', CaseSchema);

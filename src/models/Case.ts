import mongoose, { Model, Schema } from 'mongoose';
import type { ICase, ITimelineEvent } from '@/types/case';

export type { ICase };

const TimelineEventSchema = new Schema<ITimelineEvent>({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const CaseSchema = new Schema<ICase>({
  caseId: { type: String, required: true, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lawyerId: { type: Schema.Types.ObjectId, ref: 'User' },
  title_enc: { type: String, required: true },
  description_enc: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'ACTIVE', 'CLOSE_REQUESTED', 'CLOSED'],
    default: 'PENDING_REVIEW'
  },
  timeline: { type: [TimelineEventSchema], default: [] },
  integrityHash: { type: String, required: true },
}, { timestamps: true });

export const Case: Model<ICase> = mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema);

import { Document, Types } from 'mongoose';

export type CaseStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'CLOSE_REQUESTED' | 'CLOSED';

export interface ITimelineEvent {
  timestamp: Date;
  action: string;
  actorId: Types.ObjectId;
}

export interface ICase extends Document {
  caseId: string;
  clientId: Types.ObjectId;
  lawyerId?: Types.ObjectId;
  title_enc: string;
  description_enc: string;
  status: CaseStatus;
  timeline: ITimelineEvent[];
  integrityHash: string;
  createdAt: Date;
  updatedAt: Date;
}

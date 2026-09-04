import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHearing extends Document {
  caseId: string;
  date: Date;
  /** AES-encrypted title */
  title_enc: string;
  /** AES-encrypted remarks */
  remarks_enc: string;
  /** User ID of the lawyer who scheduled it */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const HearingSchema = new Schema<IHearing>(
  {
    caseId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    title_enc: { type: String, required: true },
    remarks_enc: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const Hearing = mongoose.models.Hearing || mongoose.model<IHearing>('Hearing', HearingSchema);

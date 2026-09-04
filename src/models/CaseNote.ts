import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseNote extends Document {
  caseId: string;
  authorId: string;
  authorRole: 'client' | 'lawyer' | 'admin' | 'super_admin';
  /** AES-encrypted text content */
  content_enc: string;
  /** Array of file URLs/names from UploadThing */
  attachments: { name: string; url: string; key: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const CaseNoteSchema = new Schema<ICaseNote>(
  {
    caseId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    authorRole: { type: String, required: true },
    content_enc: { type: String, required: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        key: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const CaseNote = mongoose.models.CaseNote || mongoose.model<ICaseNote>('CaseNote', CaseNoteSchema);

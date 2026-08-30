import mongoose, { Model, Schema } from 'mongoose';
import type { IAuditLog } from '@/types/audit';

export type { IAuditLog };

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, default: Date.now },
  actorBlindIndex: { type: String, required: true },
  action: { type: String, required: true },
  ipHash: { type: String, required: true },
  details_enc: { type: String },
  hash: { type: String, required: true, unique: true },
  prevHash: { type: String, required: true },
});

// Create an index on prevHash to easily traverse the chain backwards if needed
AuditLogSchema.index({ prevHash: 1 });

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

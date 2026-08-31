import dbConnect from '@/lib/db/mongoose';
import { AuditLog } from '@/models/AuditLog';
import { hmacSha256 } from '@/lib/crypto/hmac';

const AUDIT_LOG_KEY = Buffer.from(process.env.AUDIT_LOG_KEY || 'default-audit-key', 'utf-8');

export async function appendEntry(actorId: string, action: string, details: string) {
  await dbConnect();

  const lastEntry = await AuditLog.findOne().sort({ timestamp: -1 });
  const prevHash = lastEntry ? lastEntry.hash : 'genesis';
  const timestamp = new Date();

  const payloadStr = JSON.stringify({
    timestamp: timestamp.toISOString(),
    actorId,
    action,
    details,
    prevHash
  });

  const entryHash = hmacSha256(AUDIT_LOG_KEY, Buffer.from(payloadStr, 'utf-8')).toString('hex');

  const newLog = await AuditLog.create({
    timestamp,
    actorBlindIndex: actorId, // Map to model field
    action,
    ipHash: 'unknown',        // Required by model but not in signature
    details_enc: details,     // Map to model field
    hash: entryHash,
    prevHash
  });

  return newLog;
}

export async function verifyChain(): Promise<{ valid: boolean; brokenAtIndex?: number }> {
  await dbConnect();

  const logs = await AuditLog.find().sort({ timestamp: 1 });
  let currentPrevHash = 'genesis';

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    if (log.prevHash !== currentPrevHash) {
      return { valid: false, brokenAtIndex: i };
    }

    const payloadStr = JSON.stringify({
      timestamp: log.timestamp.toISOString(),
      actorId: log.actorBlindIndex,
      action: log.action,
      details: log.details_enc,
      prevHash: log.prevHash
    });

    const expectedHash = hmacSha256(AUDIT_LOG_KEY, Buffer.from(payloadStr, 'utf-8')).toString('hex');

    if (log.hash !== expectedHash) {
      return { valid: false, brokenAtIndex: i };
    }

    currentPrevHash = log.hash;
  }

  return { valid: true };
}

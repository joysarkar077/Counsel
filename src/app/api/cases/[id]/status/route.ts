import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';
import { generateHMAC } from '@/lib/crypto/hmac';
import { verifyStateTransition } from '@/lib/crypto/stateVerification';
import type { RSAPublicKey } from '@/lib/crypto/rsa';
import type { CaseStatus } from '@/types/case';

/** Valid state transitions allowed for lawyers/admins. */
const ALLOWED_TRANSITIONS: Partial<Record<CaseStatus, readonly CaseStatus[]>> = {
  PENDING_REVIEW: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['CLOSE_REQUESTED'],
  CLOSE_REQUESTED: ['CLOSED', 'ACTIVE'],
};

/**
 * PATCH /api/cases/[id]/status
 *
 * Changes a case status. Requires a valid RSA signature from the requesting
 * user proving non-repudiation (they cannot later deny authorising this change).
 *
 * Body: { newStatus, signatureHex, timestamp }
 */
const patchStatusHandler = async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;
    const userId = (req as any).userId;

    const body = await req.json() as {
      newStatus: CaseStatus;
      signatureHex: string;
      timestamp: number;
    };

    const { newStatus, signatureHex, timestamp } = body;

    if (!newStatus || !signatureHex || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: newStatus, signatureHex, timestamp' },
        { status: 400 },
      );
    }

    const [caseDoc, user] = await Promise.all([
      Case.findById(id),
      User.findById(userId),
    ]);

    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentStatus = caseDoc.status as CaseStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

    if (!(allowed as readonly string[]).includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Transition from ${currentStatus} to ${newStatus} is not permitted.` },
        { status: 422 },
      );
    }

    // Verify RSA signature — non-repudiation check.
    // The user must have signed STATE_CHANGE|caseId|oldState|newState|timestamp
    // with their RSA private key. We verify against their stored RSA public key.
    if (!user.rsaPublicKey) {
      return NextResponse.json(
        { success: false, error: 'User has no RSA public key on record.' },
        { status: 400 },
      );
    }

    let rsaPublicKey: RSAPublicKey;
    try {
      rsaPublicKey = JSON.parse(user.rsaPublicKey) as RSAPublicKey;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed RSA public key stored for user.' },
        { status: 500 },
      );
    }

    const caseId = caseDoc.caseId ?? caseDoc._id.toString();
    const isValid = await verifyStateTransition(
      caseId,
      currentStatus,
      newStatus,
      timestamp,
      signatureHex,
      rsaPublicKey,
    );

    if (!isValid) {
      await appendEntry(
        userId,
        'CASE_STATUS_SIGNATURE_INVALID',
        `Invalid RSA signature for status transition ${currentStatus}→${newStatus} on case ${caseId}`,
      );
      return NextResponse.json(
        { success: false, error: 'RSA signature verification failed. Unauthorized.' },
        { status: 403 },
      );
    }

    // Signature valid — apply the status change.
    caseDoc.status = newStatus;
    caseDoc.timeline.push({
      action: `Status changed from ${currentStatus} to ${newStatus}`,
      actorId: userId,
    } as any);

    // Recompute HMAC to maintain tamper-evidence chain.
    const hmacPayload = [
      caseDoc.clientId,
      caseDoc.title_enc,
      caseDoc.description_enc,
      caseDoc.category_enc,
      caseDoc.urgency_enc,
      caseDoc.jurisdiction_enc,
      caseDoc.opposingParty_enc,
      caseDoc.claimValue_enc || '',
      caseDoc.hearingDates_enc || '',
      caseDoc.jurors_enc || '',
      caseDoc.da_enc || '',
      caseDoc.judge_enc || '',
      caseDoc.officers_enc || '',
      caseDoc.witnesses_enc || '',
      caseDoc.exhibits_enc || '',
      caseDoc.clientDocuments_enc || '',
      caseDoc.caseUpdates_enc || '',
    ].join('|');

    caseDoc.hmac = generateHMAC(process.env.SERVER_SECRET || 'dev-secret', hmacPayload);

    await caseDoc.save();

    await appendEntry(
      userId,
      'CASE_STATUS_CHANGED',
      `Changed case ${caseId} status from ${currentStatus} to ${newStatus} (RSA-signed)`,
    );

    return NextResponse.json({ success: true, data: { status: newStatus } }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id]/status error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

export const PATCH = requireRole(['lawyer', 'admin', 'super_admin'])(patchStatusHandler);


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';
import { generateHMAC } from '@/lib/crypto/hmac';

/**
 * PATCH /api/cases/[id]/client-documents
 *
 * Dedicated endpoint for clients to upload documents.
 * The main PATCH /api/cases/[id] is restricted to lawyers and admins.
 * This endpoint verifies the user is the owner of the case and only allows
 * updating the clientDocuments_enc field.
 */
const patchHandler = async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const userId = (req as any).userId;

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // Ensure the client owns this case
    if (caseDoc.clientId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this case' }, { status: 403 });
    }

    if (body.clientDocuments_enc === undefined) {
      return NextResponse.json({ success: false, error: 'Missing clientDocuments_enc field' }, { status: 400 });
    }

    caseDoc.clientDocuments_enc = body.clientDocuments_enc;
    caseDoc.timeline.push({ action: 'Client Documents Updated', actorId: userId } as any);

    // Recompute HMAC after updates
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
      caseDoc.caseUpdates_enc || ''
    ].join('|');
    caseDoc.hmac = generateHMAC(process.env.SERVER_SECRET || 'dev-secret', hmacPayload);

    const updatedCase = await caseDoc.save();

    await appendEntry(userId, 'CLIENT_DOCUMENT_UPLOADED', `Client updated documents on case ${updatedCase.caseId}`);

    return NextResponse.json({ success: true, data: updatedCase });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id]/client-documents error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update client documents' }, { status: 500 });
  }
}

export const PATCH = requireRole(['client'])(patchHandler);


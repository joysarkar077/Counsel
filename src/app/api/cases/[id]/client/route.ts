import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';

/**
 * PATCH /api/cases/[id]/client
 *
 * Assigns an actual client to a case (usually overwriting the lawyer's creator ID)
 * and stores their encrypted AES Case Key in the accessKeys lockbox.
 * Only Admins or the assigned Lawyer can perform this action.
 */
const patchHandler = async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const actorId = (req as any).userId;
    const actorRole = (req as any).role;
    
    const { clientId, encryptedCaseKey } = body;

    if (!clientId || !encryptedCaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing clientId or encryptedCaseKey' },
        { status: 400 }
      );
    }

    // 1. Fetch the case
    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // 2. Authorization check
    // If the actor is a lawyer, they must be assigned to this case.
    if (actorRole === 'lawyer' && !caseDoc.lawyerIds.includes(actorId)) {
      return NextResponse.json({ success: false, error: 'Not authorized to modify this case' }, { status: 403 });
    }

    // 3. Check if client is already assigned
    if (caseDoc.clientId === clientId) {
      return NextResponse.json({ success: false, error: 'Client is already assigned to this case' }, { status: 400 });
    }

    // 4. Update the case
    caseDoc.clientId = clientId;
    
    // Remove any existing accessKey for this specific client just in case
    caseDoc.accessKeys = caseDoc.accessKeys.filter((ak: any) => ak.userId.toString() !== clientId);

    caseDoc.accessKeys.push({
      userId: clientId,
      encryptedCaseKey
    });
    
    caseDoc.timeline.push({
      action: 'Client Assigned',
      actorId: actorId,
      timestamp: new Date()
    });

    await caseDoc.save();
    
    await appendEntry(actorId, 'CLIENT_ASSIGNED', `Assigned client ${clientId} to case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, message: 'Client assigned successfully' });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id]/client error:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign client' }, { status: 500 });
  }
}

export const PATCH = requireRole(['admin', 'super_admin', 'lawyer'])(patchHandler);

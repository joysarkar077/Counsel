import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';

/**
 * PATCH /api/cases/[id]/assign
 *
 * Assigns a lawyer to a case and stores their encrypted AES Case Key.
 * Only Admins can perform this action.
 */
const patchHandler = async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const adminId = (req as any).userId;
    
    const { lawyerId, encryptedCaseKey } = body;

    if (!lawyerId || !encryptedCaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing lawyerId or encryptedCaseKey' },
        { status: 400 }
      );
    }

    // 1. Fetch the case
    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // 2. Check if lawyer is already assigned
    if (caseDoc.lawyerIds.includes(lawyerId)) {
      return NextResponse.json({ success: false, error: 'Lawyer is already assigned to this case' }, { status: 400 });
    }

    // 3. Update the case
    caseDoc.lawyerIds.push(lawyerId);
    caseDoc.accessKeys.push({
      userId: lawyerId,
      encryptedCaseKey
    });
    
    caseDoc.timeline.push({
      action: 'Lawyer Assigned',
      actorId: adminId,
      timestamp: new Date()
    });

    await caseDoc.save();
    
    await appendEntry(adminId, 'CASE_ASSIGNED', `Assigned lawyer ${lawyerId} to case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, message: 'Lawyer assigned successfully' });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id]/assign error:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign lawyer' }, { status: 500 });
  }
}

export const PATCH = requireRole(['admin', 'super_admin'])(patchHandler);

/**
 * DELETE /api/cases/[id]/assign
 *
 * Removes a lawyer from a case and removes their access key.
 */
const deleteHandler = async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const adminId = (req as any).userId;
    
    const { lawyerId } = body;

    if (!lawyerId) {
      return NextResponse.json(
        { success: false, error: 'Missing lawyerId' },
        { status: 400 }
      );
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    if (!caseDoc.lawyerIds.includes(lawyerId)) {
      return NextResponse.json({ success: false, error: 'Lawyer is not assigned to this case' }, { status: 400 });
    }

    // Remove from lawyerIds array
    caseDoc.lawyerIds = caseDoc.lawyerIds.filter((id: string) => id !== lawyerId);
    
    // Remove from accessKeys array
    caseDoc.accessKeys = caseDoc.accessKeys.filter((ak: any) => ak.userId.toString() !== lawyerId);

    caseDoc.timeline.push({
      action: 'Lawyer Removed',
      actorId: adminId,
      timestamp: new Date()
    });

    await caseDoc.save();
    
    await appendEntry(adminId, 'CASE_UNASSIGNED', `Removed lawyer ${lawyerId} from case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, message: 'Lawyer removed successfully' });
  } catch (error: any) {
    console.error('DELETE /api/cases/[id]/assign error:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove lawyer' }, { status: 500 });
  }
}

export const DELETE = requireRole(['admin', 'super_admin'])(deleteHandler);

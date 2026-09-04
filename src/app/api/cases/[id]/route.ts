import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';

/**
 * GET /api/cases/[id]
 *
 * Returns a single case by ID. Access is role-scoped:
 * - client    → must be the case owner
 * - lawyer    → must be assigned to the case
 * - admin / super_admin → unrestricted
 */
const getHandler = async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const userId = (req as any).userId;
    const { id } = await params;
    
    const [user, caseDoc] = await Promise.all([User.findById(userId), Case.findById(id)]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // Fine-grained Role-based access control
    const isOwner = caseDoc.clientId === userId;
    const isAssignedLawyer = caseDoc.lawyerIds.includes(userId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await appendEntry(userId, 'CASE_VIEWED', `Viewed case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, data: caseDoc }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cases/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

const patchHandler = async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const userId = (req as any).userId;
    
    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { $set: body, $push: { timeline: { action: 'Case Updated', actorId: userId } } },
      { new: true }
    );

    if (!updatedCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    await appendEntry(userId, 'CASE_UPDATED', `Updated case ${updatedCase.caseId}`);

    return NextResponse.json({ success: true, data: updatedCase });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update case' }, { status: 500 });
  }
}

export const PATCH = requireRole(['lawyer', 'admin', 'super_admin'])(patchHandler);

const deleteHandler = async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = (req as any).userId;
    
    const deletedCase = await Case.findByIdAndDelete(id);

    if (!deletedCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    await appendEntry(userId, 'CASE_DELETED', `Deleted case ${deletedCase.caseId}`);

    return NextResponse.json({ success: true, message: 'Case deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/cases/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete case' }, { status: 500 });
  }
}

export const DELETE = requireRole(['admin', 'super_admin'])(deleteHandler);

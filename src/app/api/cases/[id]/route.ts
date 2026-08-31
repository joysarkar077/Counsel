import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';

/**
 * GET /api/cases/[id]
 *
 * Returns a single case by ID. Access is role-scoped:
 * - client    → must be the case owner
 * - lawyer    → must be assigned to the case
 * - admin / super_admin → unrestricted
 *
 * Note: title_enc and description_enc are ECIES bundles. Decryption
 * happens client-side once ECDSA session management (Task 6) provides
 * the user's private key through the session.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    const [user, caseDoc] = await Promise.all([User.findById(userId), Case.findById(id)]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // Role-based access control
    const isOwner = caseDoc.clientId === userId;
    const isAssignedLawyer = caseDoc.lawyerIds.includes(userId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: caseDoc }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cases/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    
    // Auth guard
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }
    
    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { $set: body, $push: { timeline: { action: 'Case Updated', actorId: userId } } },
      { new: true }
    );

    if (!updatedCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // TODO(Prome): Log this update to the AuditLog

    return NextResponse.json({ success: true, data: updatedCase });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update case' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { CaseNote } from '@/models/CaseNote';
import { requireRole } from '@/lib/auth/rbac';
import { appendEntry } from '@/lib/audit/log';

const getHandler = async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const caseDoc = await Case.findById(id).lean();
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    const isOwner = caseDoc.clientId?.toString() === userId;
    const isAssignedLawyer = caseDoc.lawyerIds?.some((lId: any) => lId.toString() === userId);
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const notes = await CaseNote.find({ caseId: id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: notes }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cases/[id]/notes error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

const postHandler = async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const caseDoc = await Case.findById(id).lean();
    if (!caseDoc) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    const isOwner = caseDoc.clientId?.toString() === userId;
    const isAssignedLawyer = caseDoc.lawyerIds?.some((lId: any) => lId.toString() === userId);
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { content_enc, attachments } = body;

    if (!content_enc) {
      return NextResponse.json({ success: false, error: 'Missing encrypted content' }, { status: 400 });
    }

    const note = await CaseNote.create({
      caseId: id,
      authorId: userId,
      authorRole: userRole,
      content_enc,
      attachments: attachments || [],
    });

    await appendEntry(userId, 'CASE_NOTE_ADDED', `Added a note to case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases/[id]/notes error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(postHandler);

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { Hearing } from '@/models/Hearing';
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

    const hearings = await Hearing.find({ caseId: id }).sort({ date: 1 }).lean();

    return NextResponse.json({ success: true, data: hearings }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cases/[id]/hearings error:', error);
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

    const isAssignedLawyer = caseDoc.lawyerIds?.some((lId: any) => lId.toString() === userId);
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAssignedLawyer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Only lawyers can schedule hearings.' }, { status: 403 });
    }

    const body = await req.json();
    const { date, title_enc, remarks_enc } = body;

    if (!date || !title_enc || !remarks_enc) {
      return NextResponse.json({ success: false, error: 'Missing required encrypted fields or date' }, { status: 400 });
    }

    const hearing = await Hearing.create({
      caseId: id,
      date: new Date(date),
      title_enc,
      remarks_enc,
      createdBy: userId,
    });

    await appendEntry(userId, 'HEARING_SCHEDULED', `Scheduled hearing for case ${caseDoc.caseId}`);

    return NextResponse.json({ success: true, data: hearing }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases/[id]/hearings error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = requireRole(['lawyer', 'admin', 'super_admin'])(postHandler);

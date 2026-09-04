import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Message } from '@/models/Message';
import { Case } from '@/models/Case';

/** Check if a userId is an authorized participant (client or lawyer) on a case. */
async function isAuthorized(caseId: string, userId: string): Promise<boolean> {
  const caseDoc = await Case.findById(caseId, 'clientId lawyerIds').lean();
  if (!caseDoc) return false;
  const isClient = caseDoc.clientId?.toString() === userId;
  const isLawyer = caseDoc.lawyerIds?.some((id: any) => id.toString() === userId);
  return isClient || isLawyer;
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (!caseId) {
      return NextResponse.json({ success: false, error: 'caseId is required' }, { status: 400 });
    }

    if (!(await isAuthorized(caseId, userId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const messages = await Message.find({ caseId }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Message GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { caseId, ciphertext } = body;

    if (!caseId || !ciphertext) {
      return NextResponse.json({ success: false, error: 'caseId and ciphertext are required' }, { status: 400 });
    }

    if (!(await isAuthorized(caseId, userId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await Message.create({
      caseId,
      senderId: userId,
      // ciphertext is a JSON string: { ciphertextHex, ivHex } — encrypted client-side
      ciphertext,
      // signature repurposed as sender identity tag for now
      signature: userId,
      integrityHash: 'n/a',
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Message POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

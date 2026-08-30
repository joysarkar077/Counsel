import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const caseItem = await Case.findById(id);
    if (!caseItem) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: caseItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch case details' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    
    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { $set: body, $push: { timeline: { action: 'Case Updated', actorId: body.actorId || id } } },
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

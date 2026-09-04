import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const cases = await Case.find({}).lean();
    if (cases.length === 0) {
      return NextResponse.json({ message: 'No cases found' });
    }
    const c = cases[0];
    return NextResponse.json({
      id: c._id,
      title_enc: c.title_enc,
      hearingDates_enc: c.hearingDates_enc,
      caseUpdates_enc: c.caseUpdates_enc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

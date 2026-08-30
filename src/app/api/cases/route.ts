import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { AuditLog } from '@/models/AuditLog';
import { generateHMAC } from '@/lib/crypto/hmac';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // In a real implementation, we would extract the user's ID from a verified session/JWT
    // For now, we assume the body provides the required fields (clientId, title_enc, description_enc)
    
    // Create the case
    const newCase = await Case.create({
      caseId: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: body.clientId,
      title_enc: body.title_enc,
      description_enc: body.description_enc,
      status: 'PENDING_REVIEW',
      timeline: [{
        action: 'Case Submitted',
        actorId: body.clientId
      }],
      integrityHash: generateHMAC('dummy_secret_key', JSON.stringify(body))
    });

    // TODO(Prome): Append to AuditLog using hash-chaining logic here

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error: any) {
    console.error('Case Creation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create case' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Fetch cases (would normally filter by the authenticated user's role/ID)
    const cases = await Case.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: cases });
  } catch (error: any) {
    console.error('Case Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cases' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { Message } from '@/models/Message';
import { verifySignature } from '@/lib/crypto/ecdsa';
import { generateHMAC } from '@/lib/crypto/hmac';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // 1. Verify the ECDSA signature before accepting the message
    // In a real scenario, fetch the sender's public key from the DB first
    const dummySenderPublicKey = 'dummy_public_key_hex';
    const isValid = verifySignature(dummySenderPublicKey, body.ciphertext, body.signature);
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid digital signature' }, { status: 401 });
    }

    // 2. Save the message
    const newMessage = await Message.create({
      caseId: body.caseId,
      senderId: body.senderId,
      ciphertext: body.ciphertext,
      signature: body.signature,
      integrityHash: generateHMAC('dummy_hmac_secret', body.ciphertext)
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Message Send Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // URL parameters (e.g., /api/messages?caseId=123)
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ success: false, error: 'caseId is required' }, { status: 400 });
    }

    const messages = await Message.find({ caseId }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Message Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

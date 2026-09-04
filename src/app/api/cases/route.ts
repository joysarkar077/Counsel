import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { encrypt, RSAPublicKey } from '@/lib/crypto/rsa';
import { generateHMAC } from '@/lib/crypto/hmac';
import { appendEntry } from '@/lib/audit/log';
import { requireRole } from '@/lib/auth/rbac';

/**
 * POST /api/cases
 *
 * Creates a new case request.
 * - Receives pre-encrypted E2EE data (AES ciphertexts) from the client.
 * - Receives `accessKeys` containing the AES key encrypted for authorized users (Creator + Admins).
 * - Attaches an HMAC fingerprint to the stored record (tamper detection).
 * - Returns the new case id on success.
 */
const postHandler = async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = (req as any).userId;

    // --- Load user to access their ECC public key ---
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAdmin && user.role !== 'client' && user.role !== 'lawyer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to create cases' },
        { status: 403 },
      );
    }

    // --- Validate request body ---
    const body = await req.json();
    
    // The client should send the data already encrypted
    const title_enc: string = body.title_enc;
    const description_enc: string = body.description_enc;
    const opposingParty_enc: string = body.opposingParty_enc;
    const claimValue_enc: string = body.claimValue_enc || '';
    const category_enc: string = body.category_enc;
    const urgency_enc: string = body.urgency_enc;
    const jurisdiction_enc: string = body.jurisdiction_enc;
    const accessKeys: { userId: string, encryptedCaseKey: string }[] = body.accessKeys;

    if (!title_enc || !description_enc || !opposingParty_enc || !category_enc || !urgency_enc || !jurisdiction_enc || !accessKeys) {
      return NextResponse.json(
        { success: false, error: 'Missing required encrypted fields or accessKeys' },
        { status: 400 },
      );
    }

    if (!Array.isArray(accessKeys) || accessKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'accessKeys array is required and must not be empty' },
        { status: 400 },
      );
    }

    let finalClientId = userId;
    let finalLawyerIds = user.role === 'lawyer' ? [userId] : [];

    if (isAdmin) {
      if (!body.clientId) {
        return NextResponse.json(
          { success: false, error: 'Admin must provide a clientId' },
          { status: 400 },
        );
      }
      finalClientId = body.clientId;
      finalLawyerIds = body.lawyerIds && Array.isArray(body.lawyerIds) ? body.lawyerIds : [];
    }

    // --- Compute HMAC fingerprint over the encrypted payload ---
    const hmacPayload = [
      finalClientId,
      title_enc,
      description_enc,
      category_enc,
      urgency_enc,
      jurisdiction_enc,
      opposingParty_enc,
      claimValue_enc,
      '', // hearingDates_enc
      '', // jurors_enc
      '', // da_enc
      '', // judge_enc
      '', // officers_enc
      '', // witnesses_enc
      '', // exhibits_enc
      ''  // caseUpdates_enc
    ].join('|');
    const hmac = generateHMAC(process.env.SERVER_SECRET || 'dev-secret', hmacPayload);

    // --- Persist ---
    const newCase = new Case({
      caseId: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: finalClientId,
      title_enc,
      description_enc,
      opposingParty_enc,
      claimValue_enc,
      category_enc,
      urgency_enc,
      jurisdiction_enc,
      lawyerIds: finalLawyerIds,
      accessKeys,
      status: 'PENDING_REVIEW',
      timeline: [{
        action: 'Case Submitted',
        actorId: userId
      }],
      hmac,
    });

    await newCase.save();
    
    await appendEntry(userId, 'CASE_CREATED', `Created case ${newCase.caseId}`);

    return NextResponse.json({ success: true, data: { id: newCase._id } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(postHandler);

/**
 * GET /api/cases
 *
 * Returns cases scoped to the authenticated user's role:
 * - client  → only their own cases
 * - lawyer  → cases they are assigned to
 * - admin / super_admin → all cases
 */
const getHandler = async function GET(req: Request) {
  try {
    await dbConnect();
    
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let query = {};
    if (user.role === 'client') {
      query = { clientId: userId };
    } else if (user.role === 'lawyer') {
      query = { lawyerIds: userId };
    }
    // admin / super_admin get all cases (empty query)

    const cases = await Case.find(query).sort({ createdAt: -1 });

    // Note: title_enc and description_enc are ECIES bundles that must be
    // decrypted client-side (or in a dedicated decrypt endpoint) with the user's private key.
    return NextResponse.json({ success: true, data: cases }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cases error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

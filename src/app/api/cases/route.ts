import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { encrypt, RSAPublicKey } from '@/lib/crypto/rsa';
import { computeHmac } from '@/lib/crypto/hmacStub';
import { appendEntry } from '@/lib/audit/log';
import { requireRole } from '@/lib/auth/rbac';

/**
 * POST /api/cases
 *
 * Creates a new case request submitted by a client.
 * - Reads the authenticated user from the session cookie
 * - Encrypts title and description with ECIES using the client's ECC public key
 * - Attaches an HMAC fingerprint to the stored record (tamper detection)
 * - Returns the new case id on success
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

    if (user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Only clients may submit case requests' },
        { status: 403 },
      );
    }

    // --- Validate request body ---
    const body = await req.json();
    const title: string = (body.title ?? '').trim();
    const description: string = (body.description ?? '').trim();
    const opposingParty: string = (body.opposingParty ?? '').trim();
    const claimValue: string = (body.claimValue ?? '').trim();
    const category: string = (body.category ?? '').trim();
    const urgency: string = (body.urgency ?? '').trim();
    const jurisdiction: string = (body.jurisdiction ?? '').trim();

    if (!title || !description || !opposingParty || !category || !urgency || !jurisdiction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title must be 200 characters or fewer' },
        { status: 400 },
      );
    }

    // --- Encrypt case content with the client's public key ---
    // Note: The comment originally said ECC, but User generation is currently using RSA.
    // Parsing the JSON string into an RSAPublicKey object.
    const publicKey: RSAPublicKey = JSON.parse(user.publicKey);
    
    const titleEncBundle = encrypt(title, publicKey);
    const descEncBundle = encrypt(description, publicKey);
    const opposingPartyEncBundle = encrypt(opposingParty, publicKey);
    const claimValueEncBundle = claimValue ? encrypt(claimValue, publicKey) : null;
    const categoryEncBundle = encrypt(category, publicKey);
    const urgencyEncBundle = encrypt(urgency, publicKey);
    const jurisdictionEncBundle = encrypt(jurisdiction, publicKey);

    const title_enc = JSON.stringify(titleEncBundle);
    const description_enc = JSON.stringify(descEncBundle);
    const opposingParty_enc = JSON.stringify(opposingPartyEncBundle);
    const claimValue_enc = claimValueEncBundle ? JSON.stringify(claimValueEncBundle) : '';
    const category_enc = JSON.stringify(categoryEncBundle);
    const urgency_enc = JSON.stringify(urgencyEncBundle);
    const jurisdiction_enc = JSON.stringify(jurisdictionEncBundle);

    // --- Compute HMAC fingerprint over the encrypted payload ---
    // TODO(PersonC): swap computeHmac() for the real hmac.ts implementation when ready.
    const hmacPayload = `${userId}|${title_enc}|${description_enc}|${category_enc}|${urgency_enc}|${jurisdiction_enc}|${opposingParty_enc}|${claimValue_enc}`;
    const hmac = computeHmac(hmacPayload);

    // --- Persist ---
    const newCase = new Case({
      caseId: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: userId,
      title_enc,
      description_enc,
      opposingParty_enc,
      claimValue_enc,
      category_enc,
      urgency_enc,
      jurisdiction_enc,
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

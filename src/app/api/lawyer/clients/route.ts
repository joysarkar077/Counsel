import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';

const getHandler = async function GET(req: Request) {
  try {
    await dbConnect();

    // Fetch all active clients with their public keys
    const clients = await User.find(
      { role: 'client' },
      '_id fullName email publicKey'
    ).lean();

    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    console.error('GET /api/lawyer/clients error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const GET = requireRole(['lawyer', 'admin', 'super_admin'])(getHandler);

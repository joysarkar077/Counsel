import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';
import { headers } from 'next/headers';

const getHandler = async function GET() {
  try {
    await dbConnect();
    
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId, 'publicKey role').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.publicKey) {
      return NextResponse.json({ success: false, error: 'User has no public key generated' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        userId: user._id.toString(),
        publicKey: user.publicKey,
        role: user.role
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/user/me/public-key error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

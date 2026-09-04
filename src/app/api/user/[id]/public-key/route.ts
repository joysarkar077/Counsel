import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';

const getHandler = async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const user = await User.findById(id, 'publicKey role').lean();
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
    console.error('GET /api/user/[id]/public-key error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

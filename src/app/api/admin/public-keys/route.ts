import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';

const getHandler = async function GET() {
  try {
    await dbConnect();
    
    // Fetch all admins and super_admins
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }, 'publicKey').lean();
    
    const adminKeys = admins.map(admin => ({
      userId: admin._id.toString(),
      publicKey: admin.publicKey,
    })).filter(k => k.publicKey);

    return NextResponse.json({ success: true, data: adminKeys }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/public-keys error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['client', 'lawyer', 'admin', 'super_admin'])(getHandler);

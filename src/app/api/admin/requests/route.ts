import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';

export async function GET() {
  try {
    const headersList = await headers();
    const userRole = headersList.get('x-user-role');

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch lawyers who are pending activation
    const requests = await User.find({ role: 'lawyer', isActive: false })
      .select('_id username_enc emailHash createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

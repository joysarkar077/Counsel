import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { appendEntry } from '@/lib/audit/log';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userRole = headersList.get('x-user-role');
    const adminId = headersList.get('x-user-id');

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    await dbConnect();
    
    const userToActivate = await User.findById(id);
    if (!userToActivate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToActivate.role !== 'lawyer') {
      return NextResponse.json({ error: 'Can only activate lawyers' }, { status: 400 });
    }

    if (userToActivate.isActive) {
      return NextResponse.json({ error: 'User is already active' }, { status: 400 });
    }

    userToActivate.isActive = true;
    await userToActivate.save();

    if (adminId) {
      await appendEntry(adminId, 'USER_ACTIVATION', `Activated lawyer account: ${userToActivate.emailHash}`);
    }

    return NextResponse.json({ message: 'Lawyer activated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error activating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

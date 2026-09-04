import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';

const getHandler = async function GET() {
  try {
    await dbConnect();
    
    // Fetch all lawyers
    const lawyers = await User.find({ role: 'lawyer' }).lean();
    
    const lawyerData = lawyers.map(lawyer => ({
      id: lawyer._id.toString(),
      name: lawyer.fullName || `Lawyer ${lawyer._id.toString().slice(-4)}`,
      department: lawyer.department || 'Unassigned',
      casesHandled: lawyer.casesHandled || 0,
      activeCases: lawyer.activeCases || 0,
    }));

    return NextResponse.json({ success: true, data: lawyerData }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/lawyers error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['admin', 'super_admin'])(getHandler);

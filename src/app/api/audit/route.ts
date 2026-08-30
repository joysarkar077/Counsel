import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Fetch logs chronologically
    const logs = await AuditLog.find().sort({ timestamp: 1 });

    // Optional: Recalculate hash chain integrity here on the fly
    // let isValidChain = true;
    // for (let i = 1; i < logs.length; i++) {
    //   if (logs[i].prevHash !== logs[i-1].hash) isValidChain = false;
    // }

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Audit Log Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

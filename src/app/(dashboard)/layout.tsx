import { headers } from 'next/headers';
import ClientLayout from './client-layout';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userRole = headersList.get('x-user-role') || 'CLIENT';

  let isActive = true;

  if (userId) {
    try {
      await dbConnect();
      const user = await User.findById(userId).select('isActive role').lean();
      if (user) {
        isActive = user.isActive ?? true;
      }
    } catch (err) {
      console.error('Error fetching user status in layout', err);
    }
  }

  return (
    <ClientLayout userRole={userRole} isActive={isActive}>
      {children}
    </ClientLayout>
  );
}

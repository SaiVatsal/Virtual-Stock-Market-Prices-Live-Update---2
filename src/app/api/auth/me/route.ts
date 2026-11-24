import { NextRequest, NextResponse } from 'next/server';
import { getUser, getAllUserProfiles } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieUserId = req.cookies.get('nexus_user_id')?.value;
  const headerUserId = req.headers.get('x-user-id');
  const userId = cookieUserId || headerUserId || 'admin';

  const user = getUser(userId);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const roleUpper = (user.role || '').toUpperCase();

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: (roleUpper === 'ADMIN' ? 'ADMIN' : 'TRADER') as 'ADMIN' | 'TRADER',
      accountNumber: user.accountNumber,
      createdAt: user.createdAt
    },
    allUsers: roleUpper === 'ADMIN' ? getAllUserProfiles() : undefined
  });
}

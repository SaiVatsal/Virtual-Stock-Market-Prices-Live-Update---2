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

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      accountNumber: user.accountNumber,
      createdAt: user.createdAt
    },
    allUsers: user.role === 'admin' ? getAllUserProfiles() : undefined
  });
}

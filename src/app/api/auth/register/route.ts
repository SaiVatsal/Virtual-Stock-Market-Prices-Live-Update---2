import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, initialBalance, leverage } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.trim().length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const startBalance = Number(initialBalance) || 100000;
    const lev = Number(leverage) || 100;

    const user = createUser(username, password, startBalance, lev);

    const response = NextResponse.json({
      success: true,
      message: `Account created successfully! Account ID: ${user.accountNumber}`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        accountNumber: user.accountNumber,
        createdAt: user.createdAt
      }
    });

    // Set user session cookie (30 days)
    response.cookies.set('nexus_user_id', user.id, {
      path: '/',
      httpOnly: false, // Accessible by client for session state
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 400 });
  }
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';

type AuthResult = {
  success: true;
  session: Session;
} | {
  success: false;
  response: NextResponse;
};

export async function auth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    session,
  };
}

export async function requireAuth(): Promise<Session> {
  const authResult = await auth();
  
  if (!authResult.success) {
    throw authResult.response;
  }
  
  return authResult.session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  
  if (session.user.role !== 'admin') {
    throw NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  return session;
}

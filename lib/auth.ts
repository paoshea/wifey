// auth.ts

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import { Session } from 'next-auth';
import { UserRole } from './types/auth';
import { z } from 'zod';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for auth
export async function requireAuth(session: Session | null): Promise<Session> {
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(session: Session | null, role: UserRole): Promise<Session> {
  const authedSession = await requireAuth(session);
  if (authedSession.user.role !== role) {
    throw new Error('Forbidden');
  }
  return authedSession;
}

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export type AuthResult = {
  success: true;
  session: Session;
} | {
  success: false;
  error: string;
};

export default authOptions;

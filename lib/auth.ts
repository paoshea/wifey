// auth.ts

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import { Session } from 'next-auth';
import { UserRole } from './types/user';
import { z } from 'zod';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

// Helper function to convert Prisma User to AdapterUser
function convertToAdapterUser(user: any): AdapterUser {
  return {
    ...user,
    email: user.email || '', // Ensure email is never null
    role: user.role as UserRole,
  } as AdapterUser;
}

// Create a custom adapter that extends PrismaAdapter
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  // Create a new adapter instance
  const adapter: Adapter = {
    createUser: async (data: Omit<AdapterUser, "id">) => {
      const user = await p.user.create({
        data: {
          ...data,
          email: data.email || '', // Ensure email is never null
          role: UserRole.USER, // Set default role for new users
        },
      });
      return convertToAdapterUser(user);
    },
    getUser: async (id: string) => {
      const user = await p.user.findUnique({ where: { id } });
      if (!user) return null;
      return convertToAdapterUser(user);
    },
    getUserByEmail: async (email: string) => {
      const user = await p.user.findUnique({ where: { email } });
      if (!user) return null;
      return convertToAdapterUser(user);
    },
    updateUser: async (data: Partial<AdapterUser> & Pick<AdapterUser, "id">) => {
      const { id, ...userData } = data;
      const user = await p.user.update({
        where: { id },
        data: userData,
      });
      return convertToAdapterUser(user);
    },
    deleteUser: async (userId: string) => {
      await p.user.delete({ where: { id: userId } });
    },
  };

  // Get the base adapter
  const baseAdapter = PrismaAdapter(p);

  // Merge the adapters, preferring our custom implementations
  return {
    ...baseAdapter,
    ...adapter,
  } as Adapter;
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
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
        session.user.role = (user.role as UserRole) || UserRole.USER;
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

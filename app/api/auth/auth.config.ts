import { NextAuthOptions, Session, DefaultSession, User as NextAuthUser } from 'next-auth';
import { Adapter } from 'next-auth/adapters';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { MongoDBAdapterOptions } from '@auth/mongodb-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb/client';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/lib/types/auth';

const prisma = new PrismaClient();

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      createdAt: Date;
      updatedAt: Date;
    } & DefaultSession['user']
  }
  interface User {
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: 'wifey',
  } as MongoDBAdapterOptions) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        const now = new Date();
        return {
          id: profile.sub,
          name: profile.name || null,
          email: profile.email || null,
          image: profile.picture || null,
          role: UserRole.USER,
          createdAt: now,
          updatedAt: now,
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const prismaUser = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!prismaUser) {
          throw new Error('No user found');
        }

        const fullUser = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!fullUser?.password) {
          throw new Error('Please sign in with Google');
        }

        const isValid = await bcrypt.compare(credentials.password, fullUser.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: prismaUser.id,
          email: prismaUser.email,
          name: prismaUser.name,
          role: fullUser.role as UserRole,
          image: fullUser.image,
          createdAt: prismaUser.createdAt,
          updatedAt: prismaUser.updatedAt,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          role: token.role!,
          createdAt: token.createdAt!,
          updatedAt: token.updatedAt!,
        },
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

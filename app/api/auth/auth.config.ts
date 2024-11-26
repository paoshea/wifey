import { NextAuthOptions, Session, DefaultSession } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb/client';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { User } from '@/lib/types/auth';
import { JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

interface ExtendedPrismaUser extends Omit<PrismaUser, 'role'> {
  password: string;
  role: 'user' | 'admin';
}

interface ExtendedUser extends User {
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface ExtendedJWT extends JWT {
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
  } & DefaultSession['user'];
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        const now = new Date();
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user' as const,
          createdAt: now,
          updatedAt: now,
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // First find the user in Prisma
        const prismaUser = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!prismaUser) {
          throw new Error('No user found with this email');
        }

        // Then get the full user data from MongoDB including password and role
        const fullUser = await clientPromise.then(client =>
          client.db().collection('users').findOne({ email: credentials.email })
        );

        if (!fullUser?.password) {
          throw new Error('No password set for this user');
        }

        const isValid = await bcrypt.compare(credentials.password, fullUser.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: prismaUser.id,
          email: prismaUser.email,
          name: prismaUser.name ?? undefined,
          role: fullUser.role ?? 'user',
          image: fullUser.image ?? undefined,
          createdAt: prismaUser.createdAt,
          updatedAt: prismaUser.updatedAt,
        } satisfies ExtendedUser;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as ExtendedUser).role;
        token.id = user.id;
        token.createdAt = (user as ExtendedUser).createdAt;
        token.updatedAt = (user as ExtendedUser).updatedAt;
      }
      return token as ExtendedJWT;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: (token as ExtendedJWT).role as ExtendedUser['role'],
          createdAt: (token as ExtendedJWT).createdAt as Date,
          updatedAt: (token as ExtendedJWT).updatedAt as Date,
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

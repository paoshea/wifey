import type { AuthOptions, Account, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../lib/prisma';
import { compare } from 'bcryptjs';
import Google from 'next-auth/providers/google';
import Github from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole } from '../../lib/types/user';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error('Missing GitHub OAuth credentials');
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || '',
          image: user.image,
          emailVerified: user.emailVerified,
          role: user.role || UserRole.USER
        } as AdapterUser;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as AdapterUser & { role: UserRole }).role || UserRole.USER;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      // Ensure role is never undefined
      if (!token.role) {
        token.role = UserRole.USER;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId,
          role: token.role || UserRole.USER,
          emailVerified: session.user.emailVerified
        }
      };
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        // Get the user's locale from the URL
        const locale = url.split('/')[3] || 'en';
        return `${baseUrl}/${locale}/dashboard`;
      }
      return url;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};

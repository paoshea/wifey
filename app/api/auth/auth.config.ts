import { NextAuthOptions } from 'next-auth';
import { DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from '@/lib/prisma';
import { UserRole, type User } from '@/lib/types/user';
import type { Session } from '@/lib/types/auth';
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: User;
  }
  interface User {
    role: UserRole;
    emailVerified: Date | null;
  }
}

// Helper function to convert Prisma User to AdapterUser
function convertToAdapterUser(user: any): AdapterUser {
  return {
    ...user,
    email: user.email || '', // Ensure email is never null
    role: user.role as UserRole,
  } as AdapterUser;
}

// Helper function to convert token_type to lowercase
function convertAccountData(account: AdapterAccount): any {
  return {
    ...account,
    token_type: account.token_type?.toLowerCase(),
  };
}

// Create a custom adapter that extends PrismaAdapter
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p);

  return {
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
    updateUser: async (data: Partial<AdapterUser>) => {
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
    linkAccount: async (data: AdapterAccount) => {
      if (baseAdapter.linkAccount) {
        await baseAdapter.linkAccount(convertAccountData(data));
      }
    },
    unlinkAccount: async (providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
      if (baseAdapter.unlinkAccount) {
        await baseAdapter.unlinkAccount(providerAccountId);
      }
    },
    getUserByAccount: async (providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
      if (baseAdapter.getUserByAccount) {
        const user = await baseAdapter.getUserByAccount(providerAccountId);
        return user ? convertToAdapterUser(user) : null;
      }
      return null;
    },
    createSession: async (data: { sessionToken: string; userId: string; expires: Date }) => {
      if (baseAdapter.createSession) {
        return baseAdapter.createSession(data);
      }
      throw new Error("Session creation not supported");
    },
    getSessionAndUser: async (sessionToken: string) => {
      if (baseAdapter.getSessionAndUser) {
        const result = await baseAdapter.getSessionAndUser(sessionToken);
        if (!result) return null;
        return {
          session: result.session,
          user: convertToAdapterUser(result.user),
        };
      }
      return null;
    },
    updateSession: async (data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">) => {
      if (baseAdapter.updateSession) {
        return baseAdapter.updateSession(data);
      }
      return null;
    },
    deleteSession: async (sessionToken: string) => {
      if (baseAdapter.deleteSession) {
        await baseAdapter.deleteSession(sessionToken);
      }
    },
    createVerificationToken: async (data: { identifier: string; expires: Date; token: string }) => {
      if (baseAdapter.createVerificationToken) {
        return baseAdapter.createVerificationToken(data);
      }
      return null;
    },
    useVerificationToken: async (params: { identifier: string; token: string }) => {
      if (baseAdapter.useVerificationToken) {
        return baseAdapter.useVerificationToken(params);
      }
      return null;
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
    error: '/error',
    verifyRequest: '/verify-request',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.hashedPassword) {
          throw new Error("User not found");
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!passwordValid) {
          throw new Error("Invalid password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email first");
        }

        return convertToAdapterUser(user);
      }
    })
  ],
  callbacks: {
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as UserRole) || UserRole.USER;
        session.user.emailVerified = token.emailVerified ?? null;
      }
      return session as Session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    }
  }
};

export default authOptions;

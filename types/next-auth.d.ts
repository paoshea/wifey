import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@/lib/types/user';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole;
    emailVerified: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string;
    role: UserRole;
    accessToken?: string;
  }
}

declare module '@auth/prisma-adapter' {
  interface AdapterUser extends DefaultUser {
    role: UserRole;
    emailVerified: Date | null;
  }
}

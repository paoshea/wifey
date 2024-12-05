import type { Session as NextAuthSession } from 'next-auth';
import type { User } from '@/lib/types/user';
import { UserRole } from '@/lib/types/user';

// Extend the built-in Session type
export interface Session extends NextAuthSession {
  user: User & {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
  };
}

// Re-export the Session type from next-auth
export type { Session as NextAuthSession } from 'next-auth';

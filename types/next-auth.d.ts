import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
      createdAt: Date;
      updatedAt: Date;
    } & DefaultSession['user'];
  }
}

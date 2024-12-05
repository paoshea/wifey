import NextAuth from 'next-auth';
import { authOptions } from '../../auth.config';

/**
 * NextAuth route handler for authentication
 * This handles all authentication routes under /api/auth/*
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

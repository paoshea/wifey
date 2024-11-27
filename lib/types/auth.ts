import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  password: z.string(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  preferredLanguage: z.string().default('en'),
  emailVerified: z.date().nullable(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

export const UserCreateSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  emailVerified: true 
}).extend({
  password: z.string().min(8)
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

export interface Session {
  user: User;
  expires: Date;
}

export interface AuthError {
  message: string;
  status: number;
}

export const ROLE_PERMISSIONS = {
  user: ['read:coverage', 'create:coverage', 'update:own-coverage'] as const,
  moderator: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage',
  ] as const,
  admin: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage',
    'manage:users',
    'manage:roles',
  ] as const,
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];

export function hasPermission(user: User, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission as any);
}

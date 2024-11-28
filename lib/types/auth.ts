// types/auth.ts

import { z } from 'zod';

export interface User {
  id: string;
  name: string | null;
  email: string;
  password: string;
  role: UserRole;
  preferredLanguage: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

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
  updatedAt: z.date(),
});

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
  [UserRole.USER]: [
    'read:coverage',
    'create:coverage',
    'update:own-coverage',
    'read:achievements',
    'update:own-profile',
  ] as const,
  [UserRole.MODERATOR]: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage',
    'manage:achievements',
    'manage:reports',
  ] as const,
  [UserRole.ADMIN]: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage',
    'manage:users',
    'manage:roles',
    'manage:system',
    'manage:achievements',
    'manage:reports',
    'manage:analytics',
  ] as const,
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];

// Get all permissions for a role including inherited ones
function getRolePermissions(role: UserRole): readonly string[] {
  switch (role) {
    case UserRole.ADMIN:
      return Array.from(new Set([
        ...ROLE_PERMISSIONS[UserRole.USER],
        ...ROLE_PERMISSIONS[UserRole.MODERATOR],
        ...ROLE_PERMISSIONS[UserRole.ADMIN]
      ]));
    case UserRole.MODERATOR:
      return Array.from(new Set([
        ...ROLE_PERMISSIONS[UserRole.USER],
        ...ROLE_PERMISSIONS[UserRole.MODERATOR]
      ]));
    case UserRole.USER:
      return ROLE_PERMISSIONS[UserRole.USER];
    default:
      return [] as const;
  }
}

export function hasPermission(user: User, permission: Permission): boolean {
  if (!user || !user.role) {
    return false;
  }

  const allPermissions = getRolePermissions(user.role);
  return allPermissions.includes(permission);
}

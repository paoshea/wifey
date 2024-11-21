export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: Date;
  image?: string;
}

export interface Session {
  user: User;
  expires: Date;
}

export interface AuthError {
  message: string;
  status: number;
}

export const ROLE_PERMISSIONS = {
  user: ['read:coverage', 'create:coverage', 'update:own-coverage'],
  moderator: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage'
  ],
  admin: [
    'read:coverage',
    'create:coverage',
    'update:coverage',
    'delete:coverage',
    'verify:coverage',
    'manage:users',
    'manage:roles'
  ],
} as const;

export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];

export function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role];
  return userPermissions.includes(permission);
}

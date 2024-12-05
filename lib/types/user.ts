import { AdapterUser } from 'next-auth/adapters';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR'
}

export interface User extends AdapterUser {
    role: UserRole;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile extends Omit<User, 'emailVerified' | 'createdAt' | 'updatedAt'> {
    points?: number;
    level?: number;
    achievements?: number;
    streak?: number;
}

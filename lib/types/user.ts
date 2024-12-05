export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR'
}

export interface UserType {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    hashedPassword: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export type SafeUser = Omit<
    UserType,
    'hashedPassword' | 'createdAt' | 'updatedAt'
>;

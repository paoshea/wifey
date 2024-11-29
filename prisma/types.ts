import { Prisma, PrismaClient, UserRole, OperatorType, ComparisonOperator } from '@prisma/client';

// Export Prisma types for reuse
export type { 
  Prisma,
  PrismaClient,
  UserRole,
  OperatorType,
  ComparisonOperator
};

// Input Types
export interface UserCreateInput {
  name?: string | null;
  email: string;
  hashedPassword?: string | null;
  role?: UserRole;
  preferredLanguage?: string;
  image?: string | null;
  emailVerified?: Date | null;
  verificationToken?: string | null;
  points?: number;
}

export interface WifiSpotCreateInput {
  name: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  signal?: number | null;
  security?: string | null;
  points?: number;
  verified?: boolean;
  verifiedBy?: string | null;
  userId: string;
}

export interface CoverageReportCreateInput {
  operator: OperatorType;
  latitude: number;
  longitude: number;
  signal: number;
  speed?: number | null;
  points?: number;
  verified?: boolean;
  verifiedBy?: string | null;
  userId: string;
}

export interface UserStreakCreateInput {
  userId: string;
  current?: number;
  longest?: number;
  lastCheckin?: Date;
}

export interface AchievementCreateInput {
  title: string;
  description: string;
  points: number;
  type: string;
  threshold: number;
  icon?: string | null;
  userId: string;
  unlockedAt?: Date | null;
}

// Prisma Select Types
export type UserSelect = Prisma.UserSelect;
export type WifiSpotSelect = Prisma.WifiSpotSelect;
export type CoverageReportSelect = Prisma.CoverageReportSelect;
export type AchievementSelect = Prisma.AchievementSelect;
export type UserStreakSelect = Prisma.UserStreakSelect;

// Prisma Include Types
export type UserInclude = Prisma.UserInclude;
export type WifiSpotInclude = Prisma.WifiSpotInclude;
export type CoverageReportInclude = Prisma.CoverageReportInclude;
export type AchievementInclude = Prisma.AchievementInclude;
export type UserStreakInclude = Prisma.UserStreakInclude;

// Prisma Where Types
export type UserWhereInput = Prisma.UserWhereInput;
export type WifiSpotWhereInput = Prisma.WifiSpotWhereInput;
export type CoverageReportWhereInput = Prisma.CoverageReportWhereInput;
export type AchievementWhereInput = Prisma.AchievementWhereInput;
export type UserStreakWhereInput = Prisma.UserStreakWhereInput;

// Prisma OrderBy Types
export type UserOrderByWithRelationInput = Prisma.UserOrderByWithRelationInput;
export type WifiSpotOrderByWithRelationInput = Prisma.WifiSpotOrderByWithRelationInput;
export type CoverageReportOrderByWithRelationInput = Prisma.CoverageReportOrderByWithRelationInput;
export type AchievementOrderByWithRelationInput = Prisma.AchievementOrderByWithRelationInput;
export type UserStreakOrderByWithRelationInput = Prisma.UserStreakOrderByWithRelationInput;

// Utility Types
export type DateTimeFilter = Prisma.DateTimeFilter;
export type StringFilter = Prisma.StringFilter;
export type IntFilter = Prisma.IntFilter;
export type FloatFilter = Prisma.FloatFilter;
export type BoolFilter = Prisma.BoolFilter;
export type JsonFilter = Prisma.JsonFilter;

// Transaction Context Type
export interface TransactionContext {
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;
}

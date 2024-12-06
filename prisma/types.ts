import type {
  Prisma,
  PrismaClient,
  User,
  UserStats,
  Achievement,
  Measurement
} from '@prisma/client';

// Define UserRole to match schema
export type UserRole = 'ADMIN' | 'MODERATOR' | 'USER';

// Export Prisma types for reuse
export type {
  Prisma,
  PrismaClient,
  User,
  UserStats,
  Achievement,
  Measurement
};

// Input Types
export type UserCreateInput = Prisma.UserCreateInput;
export type UserStatsCreateInput = Prisma.UserStatsCreateInput;
export type AchievementCreateInput = Prisma.AchievementCreateInput;
export type MeasurementCreateInput = Prisma.MeasurementCreateInput;

// Prisma Select Types
export type UserSelect = Prisma.UserSelect;
export type UserStatsSelect = Prisma.UserStatsSelect;
export type AchievementSelect = Prisma.AchievementSelect;
export type MeasurementSelect = Prisma.MeasurementSelect;

// Prisma Include Types
export type UserInclude = Prisma.UserInclude;
export type UserStatsInclude = Prisma.UserStatsInclude;
export type AchievementInclude = Prisma.AchievementInclude;

// Prisma Where Types
export type UserWhereInput = Prisma.UserWhereInput;
export type UserStatsWhereInput = Prisma.UserStatsWhereInput;
export type AchievementWhereInput = Prisma.AchievementWhereInput;
export type MeasurementWhereInput = Prisma.MeasurementWhereInput;

// Prisma OrderBy Types
export type UserOrderByWithRelationInput = Prisma.UserOrderByWithRelationInput;
export type UserStatsOrderByWithRelationInput = Prisma.UserStatsOrderByWithRelationInput;
export type AchievementOrderByWithRelationInput = Prisma.AchievementOrderByWithRelationInput;
export type MeasurementOrderByWithRelationInput = Prisma.MeasurementOrderByWithRelationInput;

// Filter Types
export enum OperatorType {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith'
}

export enum ComparisonOperator {
  GT = 'gt',
  LT = 'lt',
  GTE = 'gte',
  LTE = 'lte',
  EQ = 'eq'
}

export type DateTimeFilter = Prisma.DateTimeFilter;
export type StringFilter = Prisma.StringFilter;
export type IntFilter = Prisma.IntFilter;
export type FloatFilter = Prisma.FloatFilter;
export type BoolFilter = Prisma.BoolFilter;

export type JsonFilter = Prisma.JsonValue;
export type JsonObject = Prisma.JsonObject;
export type JsonArray = Prisma.JsonArray;

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonFilter {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (isJsonObject(value)) return true;
  if (isJsonArray(value)) return true;
  return false;
}

// Payload Types with Relations
export type UserWithRelations = User & {
  stats: UserStats | null;
  achievements: Achievement[];
  measurements: Measurement[];
};

export type UserStatsWithRelations = UserStats & {
  user: User;
};

export type AchievementWithRelations = Achievement & {
  user: User;
};

export type MeasurementWithRelations = Measurement & {
  user: User;
};

// Transaction Context Type
export type TransactionContext = {
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;
};

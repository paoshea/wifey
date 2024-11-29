import type { 
  Prisma,
  PrismaClient,
  UserRole,
  User,
  WifiSpot,
  CoverageReport,
  Achievement,
  UserStreak
} from '@prisma/client';

// Export Prisma types for reuse
export type { 
  Prisma,
  PrismaClient,
  UserRole,
  User,
  WifiSpot,
  CoverageReport,
  Achievement,
  UserStreak
};

// Input Types
export type UserCreateInput = Prisma.UserCreateInput;
export type WifiSpotCreateInput = Prisma.WifiSpotCreateInput;
export type CoverageReportCreateInput = Prisma.CoverageReportCreateInput;
export type UserStreakCreateInput = Prisma.UserStreakCreateInput;
export type AchievementCreateInput = Prisma.AchievementCreateInput;

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
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    stats: true;
    streaks: true;
    achievements: true;
  };
}>;

export type WifiSpotWithRelations = Prisma.WifiSpotGetPayload<{
  include: {
    user: true;
    verifiedByUser: true;
  };
}>;

export type CoverageReportWithRelations = Prisma.CoverageReportGetPayload<{
  include: {
    user: true;
    verifiedByUser: true;
  };
}>;

export type AchievementWithRelations = Prisma.AchievementGetPayload<{
  include: {
    user: true;
  };
}>;

export type UserStats = {
  id: string;
  userId: string;
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
  qualityScore: number;
  accuracyRate: number;
  verifiedSpots: number;
  helpfulActions: number;
  consecutiveDays: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Measurement = {
  id: string;
  userId: string;
  type: 'wifi' | 'coverage';
  latitude: number;
  longitude: number;
  signal: number;
  speed?: number;
  isRural: boolean;
  isFirstInArea: boolean;
  quality?: number;
  accuracy?: number;
  points: number;
  createdAt: Date;
  // WiFi specific fields
  name?: string;
  security?: string;
  // Coverage specific fields
  operator?: string;
  networkType?: string;
  deviceModel?: string;
  connectionType?: string;
  verified?: boolean;
};

// Transaction Context Type
export type TransactionContext = {
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;
};

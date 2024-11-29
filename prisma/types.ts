import type { 
  Prisma,
  PrismaClient,
  UserRole,
  OperatorType,
  ComparisonOperator,
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
  OperatorType,
  ComparisonOperator,
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
export type DateTimeFilter = Prisma.DateTimeFilter;
export type StringFilter = Prisma.StringFilter;
export type IntFilter = Prisma.IntFilter;
export type FloatFilter = Prisma.FloatFilter;
export type BoolFilter = Prisma.BoolFilter;
export type JsonFilter = Prisma.JsonFilter;

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

// Transaction Context Type
export type TransactionContext = {
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;
};

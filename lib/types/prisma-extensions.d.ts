import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
    interface Achievement {
        id: string;
        userId: string;
        title: string;
        description: string;
        points: number;
        icon: string;
        type: string;
        tier: string;
        requirements: Prisma.JsonValue;
        progress: number;
        isCompleted: boolean;
        unlockedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }

    interface LeaderboardEntry {
        id: string;
        userId: string;
        points: number;
        rank: number;
        timeframe: string;
        username: string;
        measurements: number;
        lastActive: Date;
        createdAt: Date;
        updatedAt: Date;
    }

    namespace Prisma {
        interface JsonFilter {
            path?: string[];
            array_contains?: any;
            string_contains?: string;
            string_starts_with?: string;
            string_ends_with?: string;
            equals?: any;
            not?: any;
        }

        type JsonNullableFilter<T extends string> = JsonFilter | null;

        interface StringFilter {
            equals?: string;
            in?: string[];
            notIn?: string[];
            lt?: string;
            lte?: string;
            gt?: string;
            gte?: string;
            contains?: string;
            startsWith?: string;
            endsWith?: string;
            not?: string;
        }

        interface DateTimeFilter {
            equals?: Date | string;
            in?: Date[] | string[];
            notIn?: Date[] | string[];
            lt?: Date | string;
            lte?: Date | string;
            gt?: Date | string;
            gte?: Date | string;
            not?: Date | string;
        }

        interface IntFilter {
            equals?: number;
            in?: number[];
            notIn?: number[];
            lt?: number;
            lte?: number;
            gt?: number;
            gte?: number;
            not?: number;
        }

        interface BoolFilter {
            equals?: boolean;
            not?: boolean;
        }

        interface AchievementWhereInput {
            AND?: AchievementWhereInput[];
            OR?: AchievementWhereInput[];
            NOT?: AchievementWhereInput[];
            id?: string | StringFilter;
            userId?: string | StringFilter;
            title?: string | StringFilter;
            description?: string | StringFilter;
            points?: number | IntFilter;
            icon?: string | StringFilter;
            type?: string | StringFilter;
            tier?: string | StringFilter;
            progress?: number | IntFilter;
            isCompleted?: boolean | BoolFilter;
            unlockedAt?: Date | DateTimeFilter | null;
            createdAt?: Date | DateTimeFilter;
            updatedAt?: Date | DateTimeFilter;
        }

        interface LeaderboardEntryWhereInput {
            AND?: LeaderboardEntryWhereInput[];
            OR?: LeaderboardEntryWhereInput[];
            NOT?: LeaderboardEntryWhereInput[];
            id?: string | StringFilter;
            userId?: string | StringFilter;
            points?: number | IntFilter;
            rank?: number | IntFilter;
            timeframe?: string | StringFilter;
            username?: string | StringFilter;
            measurements?: number | IntFilter;
            lastActive?: Date | DateTimeFilter;
            createdAt?: Date | DateTimeFilter;
            updatedAt?: Date | DateTimeFilter;
        }

        interface UserStreakWhereInput {
            AND?: UserStreakWhereInput[];
            OR?: UserStreakWhereInput[];
            NOT?: UserStreakWhereInput[];
            id?: string | StringFilter;
            userId?: string | StringFilter;
            current?: number | IntFilter;
            longest?: number | IntFilter;
            lastCheckin?: Date | DateTimeFilter;
        }

        interface UserStatsWhereInput {
            AND?: UserStatsWhereInput[];
            OR?: UserStatsWhereInput[];
            NOT?: UserStatsWhereInput[];
            id?: string | StringFilter;
            userId?: string | StringFilter;
            points?: number | IntFilter;
            createdAt?: Date | DateTimeFilter;
            updatedAt?: Date | DateTimeFilter;
        }

        interface OrderByWithRelationInput {
            [key: string]: SortOrder;
        }

        interface AchievementOrderByWithRelationInput extends OrderByWithRelationInput { }
        interface LeaderboardEntryOrderByWithRelationInput extends OrderByWithRelationInput { }
        interface UserStreakOrderByWithRelationInput extends OrderByWithRelationInput { }
        interface UserStatsOrderByWithRelationInput extends OrderByWithRelationInput { }

        type SortOrder = 'asc' | 'desc';
    }
}

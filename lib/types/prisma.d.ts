import { Prisma } from '@prisma/client';

declare global {
    namespace PrismaJson {
        type AchievementRequirement = {
            type: string;
            metric: string;
            value: number;
            operator: string;
            description?: string;
        };

        type UserStats = {
            points: number;
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
        };
    }
}

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

    interface UserStats {
        id: string;
        userId: string;
        points: number;
        stats: Prisma.JsonValue;
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
}

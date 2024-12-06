import { Prisma } from '@prisma/client';
import {
    type AchievementRequirement,
    type StatsContent,
    AchievementTier,
    RequirementOperator
} from '../../gamification/types';

// Define explicit types for our domain and Prisma models
interface DomainAchievement {
    id: string;
    userId: string;
    title: string;
    description: string;
    points: number;
    icon: string;
    type: string;
    tier: AchievementTier;
    requirements: AchievementRequirement[];
    progress: number;
    isCompleted: boolean;
    unlockedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

interface PrismaAchievement {
    id: string;
    userId: string;
    title: string;
    description: string;
    points: number;
    icon: string | null;
    type: string;
    tier: string;
    requirements: Prisma.JsonValue;
    progress: number;
    completed: boolean;
    unlockedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

type JsonRequirement = {
    type: string;
    metric: string;
    value: number;
    operator: string;
    description?: string;
};

function requirementsToJson(requirements: AchievementRequirement[]): Prisma.JsonValue {
    const jsonReqs = requirements.map(req => ({
        type: req.type,
        metric: req.metric,
        value: req.value,
        operator: req.operator,
        description: req.description
    }));
    return JSON.parse(JSON.stringify(jsonReqs));
}

function isJsonRequirement(value: unknown): value is JsonRequirement {
    if (!value || typeof value !== 'object') return false;
    const req = value as Record<string, unknown>;
    return (
        typeof req.type === 'string' &&
        typeof req.metric === 'string' &&
        typeof req.value === 'number' &&
        typeof req.operator === 'string' &&
        (req.description === undefined || typeof req.description === 'string')
    );
}

function jsonToRequirements(json: Prisma.JsonValue | null): AchievementRequirement[] {
    if (!json || !Array.isArray(json)) {
        return [];
    }

    return json
        .filter(isJsonRequirement)
        .map(req => ({
            type: req.type,
            metric: req.metric as keyof StatsContent,
            value: req.value,
            operator: req.operator as RequirementOperator,
            description: req.description
        }));
}

export function adaptPrismaToAchievement(prismaAchievement: PrismaAchievement): DomainAchievement {
    const requirements = jsonToRequirements(prismaAchievement.requirements);

    return {
        id: prismaAchievement.id,
        userId: prismaAchievement.userId,
        title: prismaAchievement.title,
        description: prismaAchievement.description,
        points: prismaAchievement.points,
        icon: prismaAchievement.icon || '',
        type: prismaAchievement.type,
        tier: prismaAchievement.tier as AchievementTier,
        requirements,
        progress: prismaAchievement.progress,
        isCompleted: prismaAchievement.completed,
        unlockedAt: prismaAchievement.unlockedAt ?? null,
        createdAt: prismaAchievement.createdAt,
        updatedAt: prismaAchievement.updatedAt
    };
}

type PrismaAchievementCreate = Omit<PrismaAchievement, 'id' | 'createdAt' | 'updatedAt'>;

export function adaptAchievementToPrisma(achievement: DomainAchievement): PrismaAchievementCreate {
    return {
        userId: achievement.userId,
        title: achievement.title,
        description: achievement.description,
        points: achievement.points,
        icon: achievement.icon,
        type: achievement.type,
        tier: achievement.tier,
        requirements: requirementsToJson(achievement.requirements),
        progress: achievement.progress,
        completed: achievement.isCompleted,
        unlockedAt: achievement.unlockedAt ?? null
    };
}

// Export the domain type for use in other files
export type { DomainAchievement as Achievement };

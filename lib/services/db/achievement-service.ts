import { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';
import { adaptPrismaToAchievement, adaptAchievementToPrisma, type Achievement } from './achievement-adapter';
import { GamificationError } from '../../gamification/errors';
import { type StatsContent, RequirementOperator } from '../../gamification/types';

export class AchievementService {
    private prisma: PrismaClient;

    constructor(prismaClient: PrismaClient = prisma) {
        this.prisma = prismaClient;
    }

    async getAchievements(userId: string): Promise<Achievement[]> {
        try {
            const achievements = await this.prisma.achievement.findMany({
                where: { userId }
            });
            return achievements.map(adaptPrismaToAchievement);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error getting achievements:', err);
            throw new GamificationError('Failed to fetch achievements', 'ACHIEVEMENT_FETCH_ERROR');
        }
    }

    async unlockAchievement(userId: string, achievementId: string): Promise<Achievement> {
        try {
            const achievement = await this.prisma.achievement.update({
                where: {
                    id: achievementId,
                    userId
                },
                data: {
                    completed: true,
                    unlockedAt: new Date()
                }
            });
            return adaptPrismaToAchievement(achievement);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error unlocking achievement:', err);
            throw new GamificationError('Failed to unlock achievement', 'ACHIEVEMENT_UPDATE_ERROR');
        }
    }

    async checkAchievementProgress(userId: string, stats: StatsContent): Promise<Achievement[]> {
        try {
            const unlockedAchievements: Achievement[] = [];
            const pendingAchievements = await this.prisma.achievement.findMany({
                where: {
                    userId,
                    completed: false
                }
            });

            for (const achievement of pendingAchievements) {
                const mappedAchievement = adaptPrismaToAchievement(achievement);
                if (this.meetsRequirements(stats, mappedAchievement)) {
                    const unlocked = await this.unlockAchievement(userId, achievement.id);
                    unlockedAchievements.push(unlocked);
                }
            }

            return unlockedAchievements;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error checking achievement progress:', err);
            throw new GamificationError('Failed to check achievements', 'ACHIEVEMENT_CHECK_ERROR');
        }
    }

    private meetsRequirements(stats: StatsContent, achievement: Achievement): boolean {
        return achievement.requirements.every(req => this.checkRequirement(stats, req));
    }

    private checkRequirement(stats: StatsContent, requirement: Achievement['requirements'][0]): boolean {
        const metricKey = requirement.metric;
        const statValue = stats[metricKey] || 0;
        const targetValue = requirement.value;

        switch (requirement.operator) {
            case RequirementOperator.GREATER_THAN:
                return statValue > targetValue;
            case RequirementOperator.GREATER_THAN_EQUAL:
                return statValue >= targetValue;
            case RequirementOperator.LESS_THAN:
                return statValue < targetValue;
            case RequirementOperator.LESS_THAN_EQUAL:
                return statValue <= targetValue;
            case RequirementOperator.EQUAL:
                return statValue === targetValue;
            case RequirementOperator.NOT_EQUAL:
                return statValue !== targetValue;
            default:
                return false;
        }
    }
}

export const achievementService = new AchievementService();

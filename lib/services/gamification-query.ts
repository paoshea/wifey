import { type LeaderboardResponse, TimeFrame } from '../gamification/types';
import { gamificationService } from './gamification-service';
import type { UserProgressData } from './gamification-service';
import type { ProgressData } from 'components/gamification/progress-visualization';

const adaptUserProgressToProgressData = (userProgress: UserProgressData): ProgressData => {
    return {
        level: userProgress.level,
        levelProgress: (userProgress.currentXP / userProgress.nextLevelXP) * 100,
        nextLevelThreshold: userProgress.nextLevelXP,
        stats: {
            totalMeasurements: userProgress.stats.totalMeasurements,
            ruralMeasurements: userProgress.stats.ruralMeasurements,
            uniqueLocations: userProgress.stats.uniqueLocations,
            contributionScore: userProgress.stats.contributionScore,
            measurementsTrend: 0, // Calculate trend if available
            ruralTrend: 0, // Calculate trend if available
            locationsTrend: 0, // Calculate trend if available
            scoreTrend: 0, // Calculate trend if available
        },
        milestones: userProgress.achievements?.map(achievement => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            completed: achievement.isCompleted,
            progress: achievement.progress,
            target: 100, // Assuming 100% is the target
            icon: achievement.icon,
        })) || [],
    };
};

export const getCachedUserProgress = async (userId: string): Promise<ProgressData> => {
    const userProgress = await gamificationService.getUserProgress(userId);
    return adaptUserProgressToProgressData(userProgress);
};

export const getCachedLeaderboard = async (timeframe: TimeFrame): Promise<LeaderboardResponse> => {
    return gamificationService.getLeaderboard(timeframe);
};

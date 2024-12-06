import { type LeaderboardResponse, TimeFrame } from '../gamification/types';
import { gamificationService } from './gamification-service';
import type { UserProgressData } from './gamification-service';

export const getCachedUserProgress = async (userId: string): Promise<UserProgressData> => {
    return gamificationService.getUserProgress(userId);
};

export const getCachedLeaderboard = async (timeframe: TimeFrame): Promise<LeaderboardResponse> => {
    return gamificationService.getLeaderboard(timeframe);
};

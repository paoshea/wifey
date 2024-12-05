import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { gamificationService } from 'lib/services/gamification-service';
import { TimeFrame } from 'lib/gamification/types';

// Types for actions that can earn points
export enum GamificationAction {
    WIFI_SUBMISSION = 'wifiSubmission',
    COVERAGE_REPORT = 'coverageReport',
    VERIFICATION = 'verification',
    STREAK_BONUS = 'streakBonus',
}

// Point values for different actions
export const POINTS = {
    [GamificationAction.WIFI_SUBMISSION]: 50,
    [GamificationAction.COVERAGE_REPORT]: 30,
    [GamificationAction.VERIFICATION]: 10,
    [GamificationAction.STREAK_BONUS]: 25,
} as const;

export function useGamification() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // Get user progress
    const { data: progress, isLoading: isLoadingProgress } = useQuery({
        queryKey: ['userProgress', userId],
        queryFn: () => {
            if (!userId) return null;
            return gamificationService.getUserProgress(userId);
        },
        enabled: !!userId,
    });

    // Get user rank
    const { data: rank } = useQuery({
        queryKey: ['userRank', userId, TimeFrame.ALL_TIME],
        queryFn: () => {
            if (!userId) return null;
            return gamificationService.getUserRank(userId, TimeFrame.ALL_TIME);
        },
        enabled: !!userId,
    });

    // Get achievements
    const { data: achievements } = useQuery({
        queryKey: ['achievements', userId],
        queryFn: () => {
            if (!userId) return null;
            return gamificationService.getAchievements(userId);
        },
        enabled: !!userId,
    });

    // Award points mutation
    const { mutate: awardPoints } = useMutation({
        mutationFn: async (points: number) => {
            if (!userId) throw new Error('User not authenticated');
            // TODO: Implement point awarding through API
            console.log('Awarding points:', points, 'to user:', userId);
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['userProgress', userId] });
            queryClient.invalidateQueries({ queryKey: ['userRank', userId] });
        },
    });

    // Check achievement completion
    const checkAchievements = useCallback(async (action: GamificationAction) => {
        if (!userId) return;
        // TODO: Implement achievement checking logic
        console.log('Checking achievements for action:', action, 'user:', userId);
    }, [userId]);

    // Add points for a specific action
    const addPoints = useCallback(async (action: keyof typeof POINTS, customPoints?: number) => {
        const points = customPoints ?? POINTS[action];
        awardPoints(points);
        await checkAchievements(action as GamificationAction);
    }, [awardPoints, checkAchievements]);

    return {
        progress,
        rank,
        achievements,
        isLoadingProgress,
        awardPoints,
        addPoints,
        checkAchievements,
        isAuthenticated: !!userId,
    };
}

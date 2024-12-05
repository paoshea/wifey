'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from 'components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { GamificationService } from 'lib/services/gamification-service';
import {
  type UserProgress,
  type LeaderboardEntry,
  type TimeFrame,
  type ValidatedAchievement,
  type MeasurementResult,
  type StatsContent,
  type ValidatedMeasurementInput,
  type ValidatedUserStats,
  isValidAchievement,
  isValidUserProgress,
  isValidUserStats,
  StatsContentSchema,
  StatsMetric,
  AchievementTier
} from 'lib/gamification/types';
import { PrismaClient, Achievement, type UserStats } from '@prisma/client';

interface UseGamificationReturn {
  achievements: ValidatedAchievement[];
  progress: Achievement[];
  userStats: ValidatedUserStats | null;
  loading: boolean;
  error: Error | null;
  checkAchievements: () => Promise<void>;
  reloadAchievements: () => Promise<void>;
  getProgressForAchievement: (achievementId: string) => Achievement | undefined;
}

// Initialize GamificationService with PrismaClient
const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);

// Default stats
const defaultStats: StatsContent = {
  points: 0,
  totalMeasurements: 0,
  ruralMeasurements: 0,
  uniqueLocations: 0,
  totalDistance: 0,
  contributionScore: 0,
  qualityScore: 0,
  accuracyRate: 0,
  verifiedSpots: 0,
  helpfulActions: 0,
  consecutiveDays: 0
};

export function useGamification(): UseGamificationReturn {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<ValidatedAchievement[]>([]);
  const [progress, setProgress] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<ValidatedUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Get achievements
      const achievementsData = await gamificationService.getAchievements(userId);
      const validatedAchievements = achievementsData.filter(isValidAchievement);
      setAchievements(validatedAchievements);

      // Get user progress with achievements and stats
      const userProgressData = await gamificationService.getUserProgress(userId);
      if (isValidUserProgress(userProgressData)) {
        // Map achievements to Achievement format
        const userAchievements = validatedAchievements.map(achievement => ({
          id: achievement.id,
          userId: achievement.userId,
          title: achievement.title,
          description: achievement.description,
          points: achievement.points,
          icon: achievement.icon,
          type: achievement.type,
          tier: achievement.tier,
          requirements: JSON.stringify(achievement.requirements),
          progress: userProgressData.achievements?.find(
            pa => pa.id === achievement.id
          )?.progress ?? 0,
          isCompleted: userProgressData.achievements?.find(
            pa => pa.id === achievement.id
          )?.isCompleted ?? false,
          unlockedAt: userProgressData.achievements?.find(
            pa => pa.id === achievement.id
          )?.unlockedAt ?? null,
          createdAt: achievement.createdAt,
          updatedAt: achievement.updatedAt
        }));
        setProgress(userAchievements);

        // Create stats from available user progress data
        const statsContent: StatsContent = {
          ...defaultStats,
          points: userProgressData.points,
          consecutiveDays: userProgressData.streak.current,
          totalMeasurements: userProgressData.achievements?.length ?? 0,
          contributionScore: userProgressData.points
        };

        // Create ValidatedUserStats object
        const newUserStats: ValidatedUserStats = {
          id: userProgressData.level.toString(),
          userProgressId: userId,
          stats: statsContent,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setUserStats(newUserStats);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const checkAchievements = useCallback(async () => {
    if (!userId || !userStats) return;

    try {
      // Get latest achievements
      const unlockedAchievements = await gamificationService.getAchievements(userId);
      const newAchievements = unlockedAchievements.filter(achievement =>
        !progress.find(p => p.id === achievement.id)
      );

      if (newAchievements.length > 0) {
        // Show toast for each unlocked achievement with proper styling and animations
        newAchievements.forEach((achievement, index) => {
          setTimeout(() => {
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{achievement.icon}</span>
                  <span>Achievement Unlocked! 🎉</span>
                </div>
              ) as unknown as string,
              description: (
                <div className="flex flex-col gap-2">
                  <div className="font-bold">{achievement.title}</div>
                  <div className="text-sm">{achievement.description}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{achievement.tier}</span>
                    <span>+{achievement.points} points</span>
                  </div>
                </div>
              ),
              duration: 8000,
              className: `achievement-toast achievement-${achievement.tier.toLowerCase()}`
            });
          }, index * 1000); // Stagger notifications
        });

        // Reload achievements to update the UI
        await loadAchievements();
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
      toast({
        title: 'Error',
        description: 'Failed to check achievements',
        variant: 'destructive'
      });
    }
  }, [userId, userStats, progress, toast, loadAchievements]);

  const getProgressForAchievement = useCallback((achievementId: string): Achievement | undefined => {
    return progress.find(p => p.id === achievementId);
  }, [progress]);

  // Initial load
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Periodic achievement check
  useEffect(() => {
    if (!userId) return;

    const checkInterval = setInterval(checkAchievements, 60000); // Check every minute

    // Also check when the window regains focus
    const handleFocus = () => {
      checkAchievements();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, checkAchievements]);

  return {
    achievements,
    progress,
    userStats,
    loading,
    error,
    checkAchievements,
    reloadAchievements: loadAchievements,
    getProgressForAchievement
  };
}

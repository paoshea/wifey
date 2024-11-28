// hooks/useGamification.tsx

import { useCallback, useEffect, useState } from 'react';
import { GamificationService } from '@/lib/services/gamification-service';
import { PrismaClient, Achievement, UserAchievement, UserProgress, UserStats } from '@prisma/client';
import {
  ValidatedAchievement,
  ValidatedUserProgress,
  ValidatedUserStats,
  AchievementTier,
  StatsContent,
  isValidAchievement,
  isValidUserProgress,
  isValidUserStats,
  StatsContentSchema,
  StatsMetric
} from '@/lib/gamification/types';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

interface UseGamificationReturn {
  achievements: ValidatedAchievement[];
  progress: UserAchievement[];
  userStats: ValidatedUserStats | null;
  loading: boolean;
  error: Error | null;
  checkAchievements: () => Promise<void>;
  reloadAchievements: () => Promise<void>;
  getProgressForAchievement: (achievementId: string) => UserAchievement | undefined;
}

// Initialize GamificationService with PrismaClient
const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);

// Default stats
const defaultStats: Record<StatsMetric, number> = {
  [StatsMetric.TOTAL_MEASUREMENTS]: 0,
  [StatsMetric.RURAL_MEASUREMENTS]: 0,
  [StatsMetric.VERIFIED_SPOTS]: 0,
  [StatsMetric.HELPFUL_ACTIONS]: 0,
  [StatsMetric.CONSECUTIVE_DAYS]: 0,
  [StatsMetric.QUALITY_SCORE]: 0,
  [StatsMetric.ACCURACY_RATE]: 0,
  [StatsMetric.UNIQUE_LOCATIONS]: 0,
  [StatsMetric.TOTAL_DISTANCE]: 0,
  [StatsMetric.CONTRIBUTION_SCORE]: 0
};

export function useGamification(): UseGamificationReturn {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<ValidatedAchievement[]>([]);
  const [progress, setProgress] = useState<UserAchievement[]>([]);
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
      const userProgressData = await gamificationService.getCachedUserProgress(userId);
      if (isValidUserProgress(userProgressData)) {
        // Map achievements to UserAchievement format
        const userAchievements = validatedAchievements.map(achievement => {
          const progressData = userProgressData.achievements.find(
            pa => pa.id === achievement.id
          );

          return {
            id: achievement.id,
            userProgressId: userProgressData.id,
            achievementId: achievement.id,
            progress: progressData?.progress ?? 0,
            target: achievement.target ?? null,
            completed: progressData?.completed ?? false,
            unlockedAt: progressData?.unlockedAt ?? null,
            notifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        setProgress(userAchievements);

        // Create stats from available user progress data
        const statsContent: StatsContent = {
          ...defaultStats,
          [StatsMetric.CONSECUTIVE_DAYS]: userProgressData.streak,
          [StatsMetric.TOTAL_MEASUREMENTS]: userProgressData.unlockedAchievements,
          [StatsMetric.CONTRIBUTION_SCORE]: userProgressData.totalPoints
        };

        // Create ValidatedUserStats object
        const newUserStats: ValidatedUserStats = {
          id: userProgressData.id,
          userProgressId: userProgressData.id,
          stats: statsContent,
          createdAt: userProgressData.createdAt,
          updatedAt: userProgressData.updatedAt
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
      // Extract just the stats content for the update
      const userProgress = await gamificationService.updateUserStats(userId, userStats.stats as StatsContent);
      const unlockedAchievements = await gamificationService.getAchievements(userId);
      const newAchievements = unlockedAchievements.filter(achievement =>
        !progress.find(p => p.achievementId === achievement.id)
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

  const getProgressForAchievement = useCallback((achievementId: string): UserAchievement | undefined => {
    return progress.find(p => p.achievementId === achievementId);
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

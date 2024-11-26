import { useCallback, useEffect, useState } from 'react';
import { gamificationService } from '@/lib/services/gamification-service';
import { 
  Achievement, 
  AchievementProgress, 
  ValidatedAchievement,
  AchievementSchema,
  AchievementProgressSchema,
  UserStats,
  ValidatedUserStats 
} from '@/lib/gamification/types';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { validateAchievement, validateUserStats } from '@/lib/gamification/validation';

interface UseGamificationReturn {
  achievements: ValidatedAchievement[];
  progress: AchievementProgress[];
  userStats: ValidatedUserStats | null;
  loading: boolean;
  error: Error | null;
  checkAchievements: () => Promise<void>;
  reloadAchievements: () => Promise<void>;
  getProgressForAchievement: (achievementId: string) => AchievementProgress | undefined;
}

export function useGamification(): UseGamificationReturn {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<ValidatedAchievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [userStats, setUserStats] = useState<ValidatedUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [achievementsList, progressList, stats] = await Promise.all([
        gamificationService.getAchievements(userId),
        gamificationService.getAchievementProgress(userId),
        gamificationService.getUserStats(userId)
      ]);

      // Validate all data
      const validatedAchievements = achievementsList.map(achievement => 
        validateAchievement(achievement)
      );

      const validatedProgress = progressList.map(progress => 
        AchievementProgressSchema.parse({
          ...progress,
          achievement: validateAchievement(progress.achievement)
        })
      );

      const validatedStats = stats ? validateUserStats(stats) : null;

      setAchievements(validatedAchievements);
      setProgress(validatedProgress);
      setUserStats(validatedStats);
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
    if (!userId) return;

    try {
      const unlockedAchievements = await gamificationService.checkAndUnlockAchievements(userId);
      
      if (unlockedAchievements.length > 0) {
        // Show toast for each unlocked achievement with proper styling and animations
        unlockedAchievements.forEach((achievement, index) => {
          setTimeout(() => {
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{achievement.icon}</span>
                  <span>Achievement Unlocked! 🎉</span>
                </div>
              ),
              description: (
                <div className="flex flex-col gap-2">
                  <div className="font-bold">{achievement.title}</div>
                  <div className="text-sm">{achievement.description}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{achievement.rarity}</span>
                    <span>+{achievement.points} points</span>
                  </div>
                </div>
              ),
              duration: 8000,
              className: `achievement-toast achievement-${achievement.rarity}`
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
  }, [userId, toast, loadAchievements]);

  const getProgressForAchievement = useCallback((achievementId: string): AchievementProgress | undefined => {
    return progress.find(p => p.achievement.id === achievementId);
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

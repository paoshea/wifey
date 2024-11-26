import { useCallback, useEffect, useState } from 'react';
import { gamificationService } from '@/lib/services/gamification-service';
import { Achievement, AchievementProgress, UserAchievement } from '@/lib/gamification/types';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

interface UseGamificationReturn {
  achievements: Achievement[];
  progress: AchievementProgress[];
  loading: boolean;
  error: Error | null;
  checkAchievements: () => Promise<void>;
  reloadAchievements: () => Promise<void>;
}

export function useGamification(): UseGamificationReturn {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [achievementsList, progressList] = await Promise.all([
        gamificationService.getAchievements(userId),
        gamificationService.getAchievementProgress(userId)
      ]);

      setAchievements(achievementsList);
      setProgress(progressList);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load achievements'));
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
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
        // Show toast for each unlocked achievement
        unlockedAchievements.forEach(achievement => {
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `${achievement.title} - ${achievement.description}`,
            duration: 5000
          });
        });

        // Reload achievements to update the UI
        await loadAchievements();
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  }, [userId, toast, loadAchievements]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  return {
    achievements,
    progress,
    loading,
    error,
    checkAchievements,
    reloadAchievements: loadAchievements
  };
}

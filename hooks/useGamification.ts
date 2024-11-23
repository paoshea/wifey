import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  UserProgress, 
  ContributionReward, 
  LeaderboardEntry 
} from '@/lib/gamification/types';
import { GamificationService } from '@/lib/gamification/gamification-service';
import { getLevelProgress } from '@/lib/gamification/achievements';

const gamificationService = new GamificationService();

interface UseGamificationReturn {
  userProgress: UserProgress | null;
  isLoading: boolean;
  error: Error | null;
  processMeasurement: (
    isRuralArea: boolean,
    isFirstInArea: boolean,
    quality: number
  ) => Promise<void>;
  getLeaderboard: (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ) => Promise<LeaderboardEntry[]>;
  getUserRank: (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ) => Promise<{ rank: number; total: number }>;
  levelProgress: {
    progress: number;
    nextThreshold: number;
  } | null;
}

export function useGamification(): UseGamificationReturn {
  const { data: session } = useSession();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [levelProgress, setLevelProgress] = useState<{
    progress: number;
    nextThreshold: number;
  } | null>(null);

  // Fetch user progress
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const progress = await gamificationService.getUserProgress(session.user.id);
        setUserProgress(progress);
        setLevelProgress(getLevelProgress(progress.totalPoints));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user progress'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [session?.user?.id]);

  // Process new measurements
  const processMeasurement = useCallback(async (
    isRuralArea: boolean,
    isFirstInArea: boolean,
    quality: number
  ) => {
    if (!session?.user?.id || !userProgress) return;

    try {
      const reward = await gamificationService.processMeasurement(
        session.user.id,
        isRuralArea,
        isFirstInArea,
        quality
      );

      // Update local state
      setUserProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalPoints: prev.totalPoints + reward.points,
          level: reward.levelUp?.newLevel || prev.level,
          achievements: [
            ...prev.achievements,
            ...(reward.achievements?.map(a => a.id) || [])
          ]
        };
      });

      // Show rewards toast
      showRewardToast(reward);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process measurement'));
      toast.error('Failed to process measurement rewards');
    }
  }, [session?.user?.id, userProgress]);

  // Fetch leaderboard
  const getLeaderboard = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ) => {
    return gamificationService.getLeaderboard(timeframe);
  }, []);

  // Get user rank
  const getUserRank = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ) => {
    if (!session?.user?.id) {
      return { rank: 0, total: 0 };
    }
    return gamificationService.getUserRank(session.user.id, timeframe);
  }, [session?.user?.id]);

  return {
    userProgress,
    isLoading,
    error,
    processMeasurement,
    getLeaderboard,
    getUserRank,
    levelProgress
  };
}

// Helper function to show reward toasts
function showRewardToast(reward: ContributionReward) {
  // Base points
  let message = `+${reward.points} points`;

  // Bonuses
  if (reward.bonuses.ruralArea) {
    message += `\n🌾 Rural bonus: +${reward.bonuses.ruralArea}`;
  }
  if (reward.bonuses.firstInArea) {
    message += `\n🎯 First explorer: +${reward.bonuses.firstInArea}`;
  }
  if (reward.bonuses.consistencyStreak) {
    message += `\n🔥 Streak bonus: +${reward.bonuses.consistencyStreak}`;
  }

  // New achievements
  reward.achievements?.forEach(achievement => {
    toast.success(`🏆 New Achievement: ${achievement.title}`, {
      description: achievement.description
    });
  });

  // Level up
  if (reward.levelUp) {
    toast.success(`🎉 Level Up! You're now level ${reward.levelUp.newLevel}`, {
      description: `Rewards: ${reward.levelUp.rewards.join(', ')}`
    });
  }

  // Show points toast last
  toast.success('Points Earned!', {
    description: message
  });
}

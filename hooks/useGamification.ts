import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { 
  UserProgress, 
  ContributionReward, 
  LeaderboardEntry,
  Achievement 
} from '../lib/gamification/types';
import { GamificationService } from '../lib/services/gamification-service';
import { calculateLevel, getNextLevelThreshold } from '../lib/gamification/achievements';
import { Session } from '../lib/types/auth';

interface UserAchievement {
  achievementId: string;
  achievement: Achievement;
  unlockedAt: Date | null;
}

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
  const { data: session } = useSession() as { data: Session | null };
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [levelProgress, setLevelProgress] = useState<{
    progress: number;
    nextThreshold: number;
  } | null>(null);

  // Fetch user progress
  useEffect(() => {
    if (!session?.user) return;

    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const achievements = await gamificationService.getUserAchievements(session.user.id) as UserAchievement[];
        const totalPoints = achievements.reduce((sum, achievement) => 
          achievement.unlockedAt ? sum + achievement.achievement.points : sum, 0);
        
        if (typeof totalPoints === 'number') {
          const level = calculateLevel(totalPoints);
          setUserProgress({
            totalPoints,
            level,
            achievements: achievements.filter(a => a.unlockedAt).map(a => a.achievementId),
            stats: {
              totalMeasurements: 0,
              ruralMeasurements: 0,
              verifiedSpots: 0,
              helpfulActions: 0,
              consecutiveDays: 0,
              lastMeasurementDate: new Date().toISOString()
            }
          });
          setLevelProgress({
            progress: totalPoints,
            nextThreshold: getNextLevelThreshold(level)
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user progress'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [session?.user]);

  // Process new measurements
  const processMeasurement = useCallback(async (
    isRuralArea: boolean,
    isFirstInArea: boolean,
    quality: number
  ) => {
    if (!session?.user || !userProgress) return;

    try {
      const reward = await gamificationService.processMeasurement(
        session.user.id,
        { isRural: isRuralArea, isFirstInArea, quality }
      );

      // Update local state
      setUserProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalPoints: prev.totalPoints + (reward?.points || 0),
          level: reward?.levelUp?.newLevel || prev.level,
          achievements: [
            ...prev.achievements,
            ...(reward?.achievements?.map((a: Achievement) => a.id) || [])
          ]
        };
      });

      // Show rewards toast
      if (reward) {
        showRewardToast(reward);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process measurement'));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process measurement rewards"
      });
    }
  }, [session?.user, userProgress]);

  // Fetch leaderboard
  const getLeaderboard = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ): Promise<LeaderboardEntry[]> => {
    return gamificationService.getLeaderboard(timeframe);
  }, []);

  // Get user rank
  const getUserRank = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ): Promise<{ rank: number; total: number }> => {
    if (!session?.user) {
      return { rank: 0, total: 0 };
    }
    return gamificationService.getLeaderboard(timeframe).then(leaderboard => {
      const userEntry = leaderboard.find(entry => entry.userId === session.user.id);
      return {
        rank: userEntry?.rank || 0,
        total: leaderboard.length
      };
    });
  }, [session?.user]);

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
function showRewardToast(reward: ContributionReward): void {
  let message = `+${reward.points} points earned!`;

  // Add bonus point details
  if (reward.bonuses.ruralArea) {
    message += `\n🌳 Rural area bonus: +${reward.bonuses.ruralArea}`;
  }
  if (reward.bonuses.firstInArea) {
    message += `\n🎯 First in area: +${reward.bonuses.firstInArea}`;
  }
  if (reward.bonuses.qualityBonus) {
    message += `\n✨ Quality bonus: +${reward.bonuses.qualityBonus}`;
  }
  if (reward.bonuses.consistencyStreak) {
    message += `\n🔥 Streak bonus: +${reward.bonuses.consistencyStreak}`;
  }

  // New achievements
  reward.achievements?.forEach(achievement => {
    toast({
      title: "🏆 New Achievement: " + achievement.title,
      description: achievement.description
    });
  });

  // Level up
  if (reward.levelUp) {
    toast({
      title: "🎉 Level Up! You're now level " + reward.levelUp.newLevel,
      description: "Rewards: " + reward.levelUp.rewards.join(', ')
    });
  }

  // Show points toast last
  toast({
    title: "Points Earned!",
    description: message
  });
}

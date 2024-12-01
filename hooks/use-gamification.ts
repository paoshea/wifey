import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface GamificationStats {
  points: number;
  rank: number;
  totalContributions: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  nextMilestone: number;
  progressToNextMilestone: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

async function fetchGamificationStats(userId: string): Promise<GamificationStats> {
  const response = await fetch(`/api/gamification/stats?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch gamification stats');
  }
  return response.json();
}

async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const response = await fetch(`/api/gamification/achievements?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch achievements');
  }
  return response.json();
}

export function useGamification() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ['gamification', 'stats', userId],
    queryFn: () => fetchGamificationStats(userId!),
    enabled: !!userId,
  });

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    error: achievementsError,
  } = useQuery({
    queryKey: ['gamification', 'achievements', userId],
    queryFn: () => fetchAchievements(userId!),
    enabled: !!userId,
  });

  const isLoading = isLoadingStats || isLoadingAchievements;
  const error = statsError || achievementsError;

  return {
    stats,
    achievements,
    isLoading,
    error,
  };
}

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

const defaultStats: GamificationStats = {
  points: 0,
  rank: 0,
  totalContributions: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  nextMilestone: 0,
  progressToNextMilestone: 0,
};

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
  });

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  return response.json();
}

async function fetchGamificationStats(userId: string): Promise<GamificationStats> {
  try {
    return await fetchWithAuth(`/api/gamification/stats?userId=${userId}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return defaultStats;
    }
    throw error;
  }
}

async function fetchAchievements(userId: string): Promise<Achievement[]> {
  try {
    return await fetchWithAuth(`/api/gamification/achievements?userId=${userId}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return [];
    }
    throw error;
  }
}

export function useGamification() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const isAuthenticated = status === 'authenticated';

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ['gamification', 'stats', userId],
    queryFn: () => {
      if (!userId || !isAuthenticated) {
        return Promise.resolve(defaultStats);
      }
      return fetchGamificationStats(userId);
    },
    enabled: isAuthenticated && !!userId,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message === 'Unauthorized') {
        return false;
      }
      return failureCount < 3;
    },
  });

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    error: achievementsError,
  } = useQuery({
    queryKey: ['gamification', 'achievements', userId],
    queryFn: () => {
      if (!userId || !isAuthenticated) {
        return Promise.resolve([]);
      }
      return fetchAchievements(userId);
    },
    enabled: isAuthenticated && !!userId,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message === 'Unauthorized') {
        return false;
      }
      return failureCount < 3;
    },
  });

  const isLoading = isLoadingStats || isLoadingAchievements;
  const error = statsError || achievementsError;

  return {
    stats: stats || defaultStats,
    achievements: achievements || [],
    isLoading,
    error,
    isAuthenticated,
  };
}

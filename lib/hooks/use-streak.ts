import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StreakStatus {
  current: number;
  longest: number;
  lastCheckin: Date;
  canCheckInToday: boolean;
}

export function useStreak() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch streak status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/streaks');
      if (!response.ok) throw new Error('Failed to fetch streak status');
      const data = await response.json();
      setStatus({
        ...data,
        lastCheckin: new Date(data.lastCheckin)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update streak (check-in)
  const checkIn = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/streaks', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to update streak');
      const data = await response.json();
      setStatus({
        ...data,
        lastCheckin: new Date(data.lastCheckin)
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset streak
  const resetStreak = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/streaks', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to reset streak');
      const data = await response.json();
      setStatus({
        ...data,
        lastCheckin: new Date(data.lastCheckin)
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch streak status on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchStatus();
    }
  }, [session]);

  return {
    status,
    loading,
    error,
    checkIn,
    resetStreak,
    refresh: fetchStatus
  };
}

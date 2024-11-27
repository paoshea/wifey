'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamificationService } from '@/lib/gamification/gamification-service';
import { LeaderboardEntry, LeaderboardTimeframe, AchievementTier } from '@/lib/gamification/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  refreshInterval?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshInterval = 30000 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('DAILY');
  const [searchQuery, setSearchQuery] = useState('');

  const gamificationService = useMemo(() => new GamificationService(), []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gamificationService.getLeaderboard(timeframe);
      setEntries(data);
    } catch (err) {
      setError('Error loading leaderboard');
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, gamificationService]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchLeaderboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLeaderboard, refreshInterval]);

  const filteredEntries = entries.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadgeClass = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-yellow-950';
      case 2:
        return 'bg-gray-300 text-gray-950';
      case 3:
        return 'bg-amber-600 text-amber-950';
      default:
        return 'bg-gray-100 text-gray-950';
    }
  };

  const getAchievementTierColor = (tier: AchievementTier): string => {
    switch (tier) {
      case AchievementTier.LEGENDARY:
        return 'text-purple-500';
      case AchievementTier.EPIC:
        return 'text-orange-500';
      case AchievementTier.RARE:
        return 'text-blue-500';
      case AchievementTier.COMMON:
      default:
        return 'text-gray-500';
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner data-testid="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <Select
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as LeaderboardTimeframe)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Today</SelectItem>
            <SelectItem value="WEEKLY">This Week</SelectItem>
            <SelectItem value="MONTHLY">This Month</SelectItem>
            <SelectItem value="ALL_TIME">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />

      <div className="space-y-2">
        {filteredEntries.map((entry) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Badge className={cn("w-8 h-8 rounded-full flex items-center justify-center", getRankBadgeClass(entry.rank))}>
                {entry.rank}
              </Badge>
              <Avatar>
                {entry.avatarUrl ? (
                  <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                ) : (
                  <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold">{entry.username}</h3>
                <p className="text-sm text-gray-500">Level {entry.level}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {entry.topAchievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn("text-2xl", getAchievementTierColor(achievement.tier))}
                  title={achievement.title}
                >
                  {achievement.icon}
                </div>
              ))}
              <div className="text-lg font-bold">
                {entry.points.toLocaleString()} pts
              </div>
            </div>
          </motion.div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

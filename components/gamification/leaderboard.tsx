// components/gamification/leaderboard.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamificationService } from '@/lib/gamification/gamification-service';
import { AchievementTier } from '@/lib/gamification/types';
import { LeaderboardEntry, TimeFrame, leaderboardService } from '@/lib/services/leaderboard-service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  refreshInterval?: number;
}

interface LeaderboardAchievement {
  id: string;
  title: string;
  tier: AchievementTier;
  unlockedAt: Date | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshInterval = 30000 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaderboardService.getLeaderboard(timeframe);
      setEntries(data.entries);
    } catch (err) {
      setError('Error loading leaderboard');
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchLeaderboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLeaderboard, refreshInterval]);

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white';
      case 2:
        return 'bg-gray-400 text-white';
      case 3:
        return 'bg-amber-700 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
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
      <div className="text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  const filteredEntries = entries.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <Select
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as TimeFrame)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="allTime">All Time</SelectItem>
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

      <AnimatePresence>
        <div className="space-y-2">
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Badge className={cn("w-8 h-8 rounded-full flex items-center justify-center", getRankBadgeClass(entry.rank))}>
                  {entry.rank}
                </Badge>
                <Avatar>
                  <AvatarImage
                    src={entry.image || undefined}
                    alt={entry.username}
                  />
                  <AvatarFallback>
                    {entry.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{entry.username}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Level {entry.level}</span>
                    <span>•</span>
                    <span>{entry.badges} badges</span>
                    <span>•</span>
                    <span>{entry.contributions} contributions</span>
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold">
                {entry.points.toLocaleString()} pts
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

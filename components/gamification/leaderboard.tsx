import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamificationService } from '../../lib/gamification/gamification-service';
import { LeaderboardEntry } from '../../lib/gamification/types';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Spinner } from '../ui/spinner';

interface LeaderboardProps {
  refreshInterval?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshInterval = 30000 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  const gamificationService = new GamificationService();

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

  const filteredEntries = entries.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return 'default';
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
          onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="allTime">All Time</option>
        </Select>
      </div>

      <Input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No entries found
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center p-4 bg-white rounded-lg shadow"
              >
                <div
                  data-testid={`rank-badge-${entry.rank}`}
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${getRankBadgeClass(entry.rank)}`}
                >
                  {entry.rank}
                </div>
                <Avatar
                  src={entry.avatar}
                  alt={entry.username}
                  className="ml-4"
                />
                <div className="ml-4 flex-grow">
                  <div className="font-medium">{entry.username}</div>
                  <div className="text-sm text-gray-500">{entry.points} points</div>
                </div>
                {entry.rank <= 3 && (
                  <Badge variant="secondary" className="ml-2">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

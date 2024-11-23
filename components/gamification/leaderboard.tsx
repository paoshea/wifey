'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import { LeaderboardEntry } from '@/lib/gamification/types';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const timeframes = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'allTime', label: 'All Time' }
] as const;

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  rank: number;
}

const LeaderboardRow = ({ entry, isCurrentUser, rank }: LeaderboardRowProps) => {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center p-4 rounded-lg transition-colors',
        isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
      )}
    >
      <div className="flex-none w-12 text-center font-bold">
        {getRankEmoji(rank) || `#${rank}`}
      </div>
      <div className="flex-grow flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {entry.avatarUrl ? (
            <img 
              src={entry.avatarUrl} 
              alt={entry.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              👤
            </div>
          )}
        </div>
        <div>
          <div className="font-medium">{entry.username}</div>
          <div className="text-sm text-gray-500">Level {entry.level}</div>
        </div>
      </div>
      <div className="flex-none text-right">
        <div className="font-bold">{entry.points.toLocaleString()}</div>
        <div className="text-sm text-gray-500">points</div>
      </div>
    </motion.div>
  );
};

export function Leaderboard() {
  const { data: session } = useSession();
  const { getLeaderboard, getUserRank } = useGamification();
  const [timeframe, setTimeframe] = useState<typeof timeframes[number]['id']>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaderboardData, rankData] = await Promise.all([
          getLeaderboard(timeframe),
          session?.user?.id ? getUserRank(timeframe) : null
        ]);
        setEntries(leaderboardData);
        setUserRank(rankData);
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, getLeaderboard, getUserRank, session?.user?.id]);

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
        {timeframes.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTimeframe(id)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              timeframe === id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User's Rank */}
      {session?.user && userRank && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Your Ranking</div>
          <div className="mt-1 text-2xl font-bold">
            #{userRank.rank.toLocaleString()}
            <span className="text-base font-normal text-gray-600 ml-2">
              of {userRank.total.toLocaleString()} players
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="space-y-2 text-center">
                <div className="animate-spin text-2xl">🔄</div>
                <div className="text-gray-500">Loading leaderboard...</div>
              </div>
            </motion.div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-500"
            >
              No entries for this timeframe yet.
              Be the first to contribute!
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {entries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  isCurrentUser={entry.userId === session?.user?.id}
                  rank={index + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

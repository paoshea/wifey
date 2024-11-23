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

export function Leaderboard({ entries, timeframe }: { entries: LeaderboardEntry[]; timeframe: string }) {
  const { data: session } = useSession();
  const [showUserStats, setShowUserStats] = useState(false);

  const currentUserEntry = entries.find(entry => entry.userId === session?.user?.id);
  const currentUserRank = entries.findIndex(entry => entry.userId === session?.user?.id) + 1;

  return (
    <div className="space-y-6">
      {/* Timeframe Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {timeframes.map(({ id, label }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
              timeframe === id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => {/* Handled by parent */}}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Current User Stats */}
      {currentUserEntry && (
        <motion.div
          initial={false}
          animate={{ height: showUserStats ? 'auto' : '80px' }}
          className="bg-blue-50 rounded-lg overflow-hidden"
        >
          <div 
            className="p-4 cursor-pointer"
            onClick={() => setShowUserStats(!showUserStats)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {currentUserEntry.avatarUrl ? (
                    <img
                      src={currentUserEntry.avatarUrl}
                      alt={currentUserEntry.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">Your Position</div>
                  <div className="text-sm text-gray-600">
                    Rank #{currentUserRank} • Level {currentUserEntry.level}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showUserStats ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showUserStats ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showUserStats && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Points</div>
                    <div className="text-lg font-bold">{currentUserEntry.points.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Measurements</div>
                    <div className="text-lg font-bold">{currentUserEntry.measurements.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Rural Coverage</div>
                    <div className="text-lg font-bold">{currentUserEntry.ruralMeasurements.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Locations</div>
                    <div className="text-lg font-bold">{currentUserEntry.uniqueLocations.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y">
          <AnimatePresence>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <LeaderboardRow
                  entry={entry}
                  isCurrentUser={entry.userId === session?.user?.id}
                  rank={index + 1}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {entries.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900">No entries yet</h3>
            <p className="text-gray-500">Be the first to make it to the leaderboard!</p>
          </div>
        )}
      </div>

      {/* Pagination or Load More */}
      {entries.length > 0 && entries.length % 10 === 0 && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Load More
          </motion.button>
        </div>
      )}
    </div>
  );
}

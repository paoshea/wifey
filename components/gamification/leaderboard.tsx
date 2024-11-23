import React from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { LeaderboardEntry } from '@/lib/gamification/types';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all';
  onTimeframeChange?: (timeframe: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  timeframe,
  onTimeframeChange
}) => {
  const [isStatsExpanded, setIsStatsExpanded] = React.useState(false);
  const currentUser = entries.find(entry => entry.isCurrentUser);

  const timeframes = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'all', label: 'All Time' }
  ];

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '👑';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  if (!entries.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {timeframes.map(({ key, label }) => {
          const handleClick = () => {
            if (onTimeframeChange) {
              onTimeframeChange(key);
            }
          };

          return (
            <motion.button
              key={key}
              type="button"
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                timeframe === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleClick}
              variants={{
                hover: { scale: 1.05 },
                tap: { scale: 0.95 }
              }}
              whileHover="hover"
              whileTap="tap"
              role="button"
              aria-pressed={timeframe === key}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Current user stats */}
      {currentUser && (
        <motion.div
          className="bg-blue-50 rounded-lg overflow-hidden"
          animate={{ height: 'auto' }}
        >
          <div
            className="p-4 cursor-pointer"
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-medium">Your Position</div>
                  <div className="text-sm text-gray-600">
                    Rank #{currentUser.rank} • Level {currentUser.level}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isStatsExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.div>
            </div>
          </div>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: isStatsExpanded ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isStatsExpanded && (
              <div className="p-4 pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Points</span>
                  <span className="font-medium">{currentUser.points.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Leaderboard entries */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y">
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className={`flex items-center p-4 rounded-lg transition-colors ${
                  entry.isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                data-testid={`leaderboard-entry-${entry.rank}`}
                variants={{
                  hover: { scale: 1.02 }
                }}
                whileHover="hover"
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex-none w-12 text-center font-bold">
                  {getRankEmoji(entry.rank)}
                </div>
                <div className="flex-grow flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        data-testid="default-avatar"
                        className="w-full h-full flex items-center justify-center text-gray-500"
                      >
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <div data-testid="username" className="font-medium">
                      {entry.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      Level {entry.level}
                    </div>
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="font-bold">
                    {entry.points.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

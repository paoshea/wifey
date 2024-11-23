'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import { Achievement } from '@/lib/gamification/types';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onClick: () => void;
}

const AchievementCard = ({ achievement, isUnlocked, onClick }: AchievementCardProps) => {
  const tierColors = {
    bronze: 'bg-orange-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-gradient-to-r from-purple-400 to-pink-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative p-4 rounded-lg cursor-pointer transition-all',
        isUnlocked ? tierColors[achievement.tier] : 'bg-gray-800 opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="text-4xl">{achievement.icon}</div>
        <div>
          <h3 className="font-bold text-white">{achievement.title}</h3>
          <p className="text-sm text-gray-200">{achievement.description}</p>
        </div>
      </div>
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}
      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm text-white font-medium">+{achievement.points} pts</span>
        <span className="text-xs text-white opacity-75 capitalize">{achievement.tier}</span>
      </div>
    </motion.div>
  );
};

interface AchievementDetailsModalProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onClose: () => void;
}

const AchievementDetailsModal = ({ achievement, isUnlocked, onClose }: AchievementDetailsModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="text-6xl">{achievement.icon}</div>
          <div>
            <h2 className="text-2xl font-bold">{achievement.title}</h2>
            <p className="text-gray-600 capitalize">{achievement.tier} Achievement</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{achievement.description}</p>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Requirements</h3>
          <p className="text-sm text-gray-600">
            {achievement.requirements.count} {achievement.requirements.type.replace('_', ' ')}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-bold">+{achievement.points}</span>
            <span className="text-gray-600 ml-1">points</span>
          </div>
          {isUnlocked ? (
            <span className="text-green-600 font-medium">Unlocked ✓</span>
          ) : (
            <span className="text-gray-500">Locked 🔒</span>
          )}
        </div>

        <button
          className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

export function AchievementShowcase({ achievements, onAchievementClick }: { 
  achievements: Achievement[] | undefined; 
  onAchievementClick?: (achievement: Achievement) => void;
}) {
  if (!achievements) {
    return <div className="text-center p-4">Loading achievements...</div>;
  }

  if (achievements.length === 0) {
    return <div className="text-center p-4">No achievements yet</div>;
  }

  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'progress' | 'earned'>('rarity');

  const filteredAchievements = achievements
    .filter(achievement => filter === 'all' || achievement.completed === (filter === 'completed'))
    .sort((a, b) => {
      if (sortBy === 'rarity') {
        const rarityOrder = { epic: 0, rare: 1, common: 2 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('completed')}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          Completed
        </button>
        <label className="flex items-center space-x-2">
          Sort by:
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="ml-2 p-2 rounded border"
            aria-label="Sort by"
          >
            <option value="rarity">Rarity</option>
            <option value="progress">Progress</option>
            <option value="earned">Earned Date</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => onAchievementClick?.(achievement)}
            className={cn(
              'p-4 rounded-lg cursor-pointer',
              `achievement-${achievement.rarity}`
            )}
            data-testid="achievement-item"
          >
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{achievement.icon}</div>
              <div>
                <h3 className="font-bold">{achievement.title}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                {achievement.earnedDate && (
                  <p className="text-sm text-gray-500">
                    Earned: {new Date(achievement.earnedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
                {!achievement.completed && (
                  <p className="text-sm text-gray-500">
                    Progress: {achievement.progress}/{achievement.target} ({Math.round((achievement.progress / achievement.target) * 100)}%)
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-medium">{achievement.points} points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

export function AchievementShowcase({ achievements }: { achievements: Achievement[] }) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | Achievement['tier']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unlocked' && achievement.unlocked) || 
      (filter === 'locked' && !achievement.unlocked);
    const matchesTier = selectedTier === 'all' || achievement.tier === selectedTier;
    const matchesSearch = achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesTier && matchesSearch;
  });

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    points: achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-2xl font-bold">{stats.unlocked}/{stats.total}</div>
          <div className="text-sm text-gray-500">Achievements Unlocked</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-4xl mb-2">✨</div>
          <div className="text-2xl font-bold">{stats.points}</div>
          <div className="text-sm text-gray-500">Total Points Earned</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-2xl font-bold">{Math.round((stats.unlocked / stats.total) * 100)}%</div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search achievements..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as typeof selectedTier)}
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <AchievementCard
                achievement={achievement}
                isUnlocked={achievement.unlocked}
                onClick={() => setSelectedAchievement(achievement)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900">No achievements found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Achievement Details Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailsModal
            achievement={selectedAchievement}
            isUnlocked={selectedAchievement.unlocked}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

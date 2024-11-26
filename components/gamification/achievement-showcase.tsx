'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import { Achievement, AchievementRequirement, ValidatedAchievement } from '@/lib/gamification/types';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: ValidatedAchievement;
  progress: number;
  target: number;
  isUnlocked: boolean;
  onClick: () => void;
}

const AchievementCard = ({ achievement, progress, target, isUnlocked, onClick }: AchievementCardProps) => {
  const rarityColors: Record<Achievement['rarity'], string> = {
    common: 'bg-blue-600',
    rare: 'bg-purple-600',
    epic: 'bg-gradient-to-r from-yellow-400 to-orange-500'
  };

  const progressPercentage = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative p-4 rounded-lg cursor-pointer transition-all',
        isUnlocked ? rarityColors[achievement.rarity] : 'bg-gray-800 opacity-60'
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
        <>
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </>
      )}
      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm text-white font-medium">+{achievement.points} pts</span>
        <span className="text-xs text-white opacity-75 capitalize">{achievement.rarity}</span>
      </div>
    </motion.div>
  );
};

interface AchievementDetailsModalProps {
  achievement: ValidatedAchievement;
  progress: number;
  target: number;
  isUnlocked: boolean;
  onClose: () => void;
}

const AchievementDetailsModal = ({ achievement, progress, target, isUnlocked, onClose }: AchievementDetailsModalProps) => {
  const progressPercentage = Math.min((progress / target) * 100, 100);

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
            <p className="text-gray-600 capitalize">{achievement.rarity} Achievement</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{achievement.description}</p>
        
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Requirements</h3>
          {achievement.requirements.map((req, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm text-gray-600">
                {req.value} {req.metric.replace('_', ' ')}
                {req.description && (
                  <span className="text-xs text-gray-500 ml-1">({req.description})</span>
                )}
              </p>
              {!isUnlocked && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-lg font-bold">+{achievement.points}</span>
            <span className="text-gray-600 ml-1">points</span>
          </div>
          {isUnlocked ? (
            <div className="flex flex-col items-end">
              <span className="text-green-600 font-medium">Unlocked ✓</span>
              <span className="text-xs text-gray-500">
                {achievement.unlockedAt?.toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-gray-500">Locked 🔒</span>
              <span className="text-xs text-gray-500">
                {progress} / {target}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

interface AchievementShowcaseProps {
  achievements?: ValidatedAchievement[];
  onAchievementClick?: (achievement: ValidatedAchievement) => void;
}

export function AchievementShowcase({ achievements = [], onAchievementClick }: AchievementShowcaseProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<ValidatedAchievement | null>(null);
  const { progress } = useGamification();

  const getProgressForAchievement = (achievementId: string) => {
    const achievementProgress = progress.find(p => p.achievement.id === achievementId);
    return {
      progress: achievementProgress?.progress || 0,
      target: achievementProgress?.target || 0,
      isUnlocked: achievementProgress?.isUnlocked || false
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => {
        const { progress, target, isUnlocked } = getProgressForAchievement(achievement.id);
        
        return (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            progress={progress}
            target={target}
            isUnlocked={isUnlocked}
            onClick={() => {
              setSelectedAchievement(achievement);
              onAchievementClick?.(achievement);
            }}
          />
        );
      })}

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailsModal
            achievement={selectedAchievement}
            {...getProgressForAchievement(selectedAchievement.id)}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

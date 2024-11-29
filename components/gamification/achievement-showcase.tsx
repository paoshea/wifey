'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import {
  Achievement,
  AchievementRequirement,
  ValidatedAchievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric
} from '@/lib/gamification/types';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: ValidatedAchievement;
  progress: number;
  target: number;
  isUnlocked: boolean;
  onClick: () => void;
}

const AchievementCard = ({ achievement, progress, target, isUnlocked, onClick }: AchievementCardProps) => {
  const rarityColors: Record<AchievementTier, string> = {
    [AchievementTier.BRONZE]: 'bg-blue-600',
    [AchievementTier.SILVER]: 'bg-purple-600',
    [AchievementTier.GOLD]: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    [AchievementTier.PLATINUM]: 'bg-gradient-to-r from-purple-400 to-pink-500'
  };

  const progressPercentage = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative p-4 rounded-lg cursor-pointer transition-all',
        isUnlocked ? rarityColors[achievement.tier] : 'bg-gray-800 opacity-60'
      )}
      onClick={onClick}
      data-testid="achievement-item"
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
        <span className="text-xs text-white opacity-75 capitalize">{achievement.tier.toLowerCase()}</span>
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

  const getRequirementText = (req: ValidatedAchievement['requirements'][0]): string => {
    const operatorText: Record<RequirementOperator, string> = {
      [RequirementOperator.GREATER_THAN]: '>',
      [RequirementOperator.GREATER_THAN_EQUAL]: '≥',
      [RequirementOperator.LESS_THAN]: '<',
      [RequirementOperator.LESS_THAN_EQUAL]: '≤',
      [RequirementOperator.EQUAL]: '=',
      [RequirementOperator.NOT_EQUAL]: '≠'
    };

    // For ValidatedAchievement requirements, we only handle STAT type
    const metricKey = req.metric as keyof typeof StatsMetric;
    return `${StatsMetric[metricKey]?.replace(/_/g, ' ') || req.metric} ${operatorText[req.operator]} ${req.value} (Current: ${req.currentValue})`;
  };

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
            <p className="text-gray-600 capitalize">{achievement.tier.toLowerCase()} Achievement</p>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{achievement.description}</p>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Requirements</h3>
          {achievement.requirements.map((req, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm text-gray-600">
                {getRequirementText(req)}
              </p>
            </div>
          ))}
        </div>

        {!isUnlocked && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Progress: {progress}/{target} ({Math.round(progressPercentage)}%)
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <span className="text-lg font-semibold">+{achievement.points} points</span>
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementShowcaseProps {
  achievements?: ValidatedAchievement[];
  onAchievementClick?: (achievement: ValidatedAchievement) => void;
}

export const AchievementShowcase = ({ achievements = [], onAchievementClick }: AchievementShowcaseProps) => {
  const [selectedAchievement, setSelectedAchievement] = useState<ValidatedAchievement | null>(null);

  if (!achievements) {
    return <div className="text-center py-8">Loading achievements...</div>;
  }

  if (achievements.length === 0) {
    return <div className="text-center py-8">No achievements yet</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          progress={achievement.progress}
          target={achievement.target}
          isUnlocked={achievement.progress >= achievement.target}
          onClick={() => {
            setSelectedAchievement(achievement);
            onAchievementClick?.(achievement);
          }}
        />
      ))}

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailsModal
            achievement={selectedAchievement}
            progress={selectedAchievement.progress}
            target={selectedAchievement.target}
            isUnlocked={selectedAchievement.progress >= selectedAchievement.target}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

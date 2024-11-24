'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Medal, Award } from 'lucide-react';
import { useGamificationStore } from '@/lib/store/gamification-store';
import { Badge, BADGES } from '@/lib/types/gamification';
import { Card, CardContent } from '@/components/ui/card';

const RARITY_COLORS = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
};

interface BadgePopupProps {
  badge: Badge;
  onClose: () => void;
}

const BadgePopup = ({ badge, onClose }: BadgePopupProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.5 }}
    className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      className="bg-white rounded-lg p-6 text-center max-w-sm mx-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className={`text-4xl mb-4 ${badge.icon}`}>
        {badge.icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{badge.name}</h3>
      <div className={`inline-block px-2 py-1 rounded-full text-xs text-white mb-4 ${RARITY_COLORS[badge.rarity]}`}>
        {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
      </div>
      <p className="text-gray-600 mb-4">{badge.description}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
      >
        Awesome!
      </button>
    </motion.div>
  </motion.div>
);

export default function AchievementDisplay() {
  const {
    achievements,
    newBadges,
    clearNewBadges,
    getPointsDisplay,
    getStreakDisplay,
    calculateLevel
  } = useGamificationStore();

  const [showBadge, setShowBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (newBadges.length > 0) {
      setShowBadge(newBadges[0]);
    }
  }, [newBadges]);

  const handleCloseBadgePopup = () => {
    setShowBadge(null);
    clearNewBadges();
  };

  const level = calculateLevel();
  const progress = achievements.points - (Math.pow(level - 1, 2) * 100);
  const nextLevel = Math.pow(level, 2) * 100;
  const progressPercentage = (progress / (nextLevel - (Math.pow(level - 1, 2) * 100))) * 100;

  return (
    <>
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{level}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Trophy className="w-4 h-4 text-yellow-900" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Level {level}</h3>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {progress} / {nextLevel} XP
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {getPointsDisplay()}
                </div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {getStreakDisplay()}
                </div>
                <div className="text-sm text-gray-500">Streak</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center">
              <Medal className="w-5 h-5 mr-2" />
              Badges ({achievements.badges.length})
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {achievements.badges.map(badgeId => {
                const badge = BADGES.find(b => b.id === badgeId)!;
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className={`
                      p-3 rounded-lg text-center cursor-pointer
                      ${RARITY_COLORS[badge.rarity]} bg-opacity-10
                      hover:bg-opacity-20 transition-all
                    `}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-sm font-medium truncate">
                      {badge.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showBadge && (
          <BadgePopup
            badge={showBadge}
            onClose={handleCloseBadgePopup}
          />
        )}
      </AnimatePresence>
    </>
  );
}

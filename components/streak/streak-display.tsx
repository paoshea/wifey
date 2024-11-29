import React from 'react';
import { motion } from 'framer-motion';
import { useStreak } from '@/lib/hooks/use-streak';
import { STREAK_ACHIEVEMENTS, STREAK_BONUSES } from '@/lib/constants/streak-achievements';

const StreakDisplay = () => {
  const { status, loading, error, checkIn } = useStreak();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  if (!status) return null;

  // Calculate current multiplier
  const getCurrentMultiplier = (streak: number) => {
    const thresholds = Object.keys(STREAK_BONUSES.MULTIPLIERS)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      if (streak >= threshold) {
        return STREAK_BONUSES.MULTIPLIERS[threshold as keyof typeof STREAK_BONUSES.MULTIPLIERS];
      }
    }
    return 1;
  };

  // Find next achievement
  const getNextAchievement = (streak: number) => {
    return STREAK_ACHIEVEMENTS
      .find(achievement => achievement.threshold > streak);
  };

  const currentMultiplier = getCurrentMultiplier(status.current);
  const nextAchievement = getNextAchievement(status.current);
  const progressToNext = nextAchievement 
    ? (status.current / nextAchievement.threshold) * 100
    : 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {/* Current Streak */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold text-primary mb-2"
        >
          {status.current} Days
        </motion.div>
        <p className="text-gray-600">Current Streak</p>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-semibold text-gray-800">
            {status.longest}
          </div>
          <p className="text-sm text-gray-600">Longest Streak</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-semibold text-gray-800">
            {currentMultiplier}x
          </div>
          <p className="text-sm text-gray-600">Point Multiplier</p>
        </div>
      </div>

      {/* Next Achievement Progress */}
      {nextAchievement && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Next: {nextAchievement.title}</span>
            <span>{status.current}/{nextAchievement.threshold} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              className="bg-primary h-2.5 rounded-full"
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Check-in Button */}
      {status.canCheckInToday && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={checkIn}
          className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium
                     hover:bg-primary-dark transition-colors"
        >
          Check In Today (+{STREAK_BONUSES.DAILY_BONUS * currentMultiplier} points)
        </motion.button>
      )}

      {/* Last Check-in */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Last check-in: {status.lastCheckin.toLocaleDateString()}
      </div>
    </div>
  );
};

export default StreakDisplay;

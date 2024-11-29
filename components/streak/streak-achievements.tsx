import React from 'react';
import { motion } from 'framer-motion';
import { STREAK_ACHIEVEMENTS } from '@/lib/constants/streak-achievements';
import { Achievement } from '@prisma/client';

interface StreakAchievementsProps {
  achievements: Achievement[];
}

const StreakAchievements = ({ achievements }: StreakAchievementsProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Streak Achievements</h2>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {STREAK_ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = achievements.some(
            a => a.title === achievement.title
          );

          return (
            <motion.div
              key={achievement.id}
              variants={item}
              className={`p-4 rounded-lg border ${
                isUnlocked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary">
                    +{achievement.points}
                  </div>
                  <div className="text-sm text-gray-500">
                    {achievement.threshold} days
                  </div>
                </div>
              </div>
              
              {!isUnlocked && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (achievements.length / achievement.threshold) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default StreakAchievements;

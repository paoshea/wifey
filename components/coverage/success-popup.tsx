'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Signal, Trophy, ThumbsUp, Award, Star } from 'lucide-react';
import { useGamificationStore } from 'lib/store/gamification-store';
import type { Badge } from 'lib/types/gamification';

// Import canvas-confetti using require
const confetti = require('canvas-confetti');

// Create a wrapper function for confetti with proper types
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ef4444', '#ffffff', '#f87171']
  });
};

interface SuccessPopupProps {
  show: boolean;
  onClose: () => void;
  location: { lat: number; lng: number };
}

export default function SuccessPopup({ show, onClose, location }: SuccessPopupProps) {
  const {
    achievements,
    newBadges,
    getPointsDisplay,
    getStreakDisplay,
    calculateLevel,
    addContribution,
    checkStreak
  } = useGamificationStore();

  useEffect(() => {
    if (show) {
      // Add contribution and check streak when marking a spot
      addContribution();
      checkStreak();

      // Trigger confetti effect
      triggerConfetti();
    }
  }, [show, addContribution, checkStreak]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
          >
            {/* Header with X icon */}
            <div className="relative bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <Trophy className="w-16 h-16" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-center">X Marks the Spot!</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ThumbsUp className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-lg font-medium text-gray-900">
                    Thank you for contributing!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4 my-6"
                >
                  <div className="text-center">
                    <Star className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
                    <div className="text-xl font-bold text-gray-900">
                      {getPointsDisplay()}
                    </div>
                    <div className="text-sm text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <Signal className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                    <div className="text-xl font-bold text-gray-900">
                      Level {calculateLevel()}
                    </div>
                    <div className="text-sm text-gray-500">Current Level</div>
                  </div>
                  <div className="text-center">
                    <Award className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                    <div className="text-xl font-bold text-gray-900">
                      {getStreakDisplay()}
                    </div>
                    <div className="text-sm text-gray-500">Day Streak</div>
                  </div>
                </motion.div>

                {newBadges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-yellow-50 p-4 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      🎉 New Badge{newBadges.length > 1 ? 's' : ''} Unlocked!
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {newBadges.map((badge: Badge) => (
                        <div
                          key={badge.id}
                          className="flex items-center bg-white p-2 rounded-lg shadow-sm"
                        >
                          <span className="text-2xl mr-2">{badge.icon}</span>
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{badge.name}</div>
                            <div className="text-xs text-gray-500">{badge.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600"
                >
                  Location marked at:
                  <br />
                  <span className="font-mono text-sm">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </motion.p>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={onClose}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full
                    hover:from-red-600 hover:to-red-700 transition-all duration-300
                    shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Continue Exploring
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

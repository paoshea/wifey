'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementShowcase } from '@/components/gamification/achievement-showcase';
import { Leaderboard } from '@/components/gamification/leaderboard';
import { ProgressVisualization } from '@/components/gamification/progress-visualization';
import { cn } from '@/lib/utils';
import { getCachedUserProgress, getCachedLeaderboard } from '@/lib/services/gamification-service';
import { useQuery } from '@tanstack/react-query';

const tabs = [
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '👥' }
] as const;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('progress');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('weekly');

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['userProgress', session?.user?.id],
    queryFn: () => getCachedUserProgress(session?.user?.id!),
    enabled: !!session?.user?.id,
  });

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', selectedTimeframe],
    queryFn: () => getCachedLeaderboard(selectedTimeframe),
    enabled: activeTab === 'leaderboard',
  });

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-2xl">👋</div>
          <h1 className="text-xl font-bold">Welcome to Wifey</h1>
          <p className="text-gray-600">Please sign in to view your profile</p>
          <button
            onClick={() => {/* TODO: Implement sign in */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    👤
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{session.user?.name}</h1>
                <p className="text-gray-600">{session.user?.email}</p>
                {progress && (
                  <p className="text-sm text-gray-500 mt-1">
                    Level {progress.level} • {progress.currentXP} / {progress.totalXP} XP
                  </p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200">
              <div className="flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'pb-4 px-1 border-b-2 transition-colors relative',
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </div>

                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-blue-600"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'progress' && (
              <div className="space-y-6">
                {isLoadingProgress ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin text-2xl">🔄</div>
                  </div>
                ) : progress ? (
                  <ProgressVisualization progress={progress} />
                ) : (
                  <div className="text-center text-gray-500">No progress data available</div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                {isLoadingProgress ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin text-2xl">🔄</div>
                  </div>
                ) : progress ? (
                  <AchievementShowcase achievements={progress.achievements} />
                ) : (
                  <div className="text-center text-gray-500">No achievements data available</div>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="flex justify-end space-x-2">
                  {(['daily', 'weekly', 'monthly', 'allTime'] as const).map(timeframe => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={cn(
                        'px-3 py-1 rounded-md text-sm',
                        selectedTimeframe === timeframe
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </button>
                  ))}
                </div>

                {isLoadingLeaderboard ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin text-2xl">🔄</div>
                  </div>
                ) : leaderboard ? (
                  <Leaderboard entries={leaderboard} timeframe={selectedTimeframe} />
                ) : (
                  <div className="text-center text-gray-500">No leaderboard data available</div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

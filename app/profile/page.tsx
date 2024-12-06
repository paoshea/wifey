'use client';

import { useState, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementShowcase } from 'components/gamification/achievement-showcase';
import { Leaderboard } from 'components/gamification/leaderboard';
import { ProgressVisualization } from 'components/gamification/progress-visualization';
import { cn } from 'lib/utils';
import { getCachedUserProgress, getCachedLeaderboard } from 'lib/services/gamification-query';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Trophy, Medal, Star } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Progress } from 'components/ui/progress';
import { TIER_COLORS } from 'lib/gamification/constants';
import { TimeFrame, AchievementTier } from 'lib/gamification/types';
import { Achievement } from 'lib/services/db/achievement-adapter';
import { UserStats } from '@prisma/client';

// Prevent static generation
export const dynamic = 'force-dynamic';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin text-2xl">🔄</div>
    </div>
  );
}

// Helper function to map Achievement to display format
function mapAchievementForDisplay(achievement: Achievement) {
  return {
    ...achievement,
    completed: achievement.isCompleted,
  };
}

// Helper function to calculate achievement progress
function getAchievementProgress(
  achievement: Achievement
): number {
  if (!achievement) return 0;
  return achievement.progress;
}

const tabs = [
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '👥' }
] as const;

// Main profile content
function ProfileContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      signIn();
    },
  });

  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('progress');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(TimeFrame.WEEKLY);

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

  if (status === 'loading') {
    return <LoadingSpinner />;
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
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Profile'}
                    width={128}
                    height={128}
                    className="rounded-full"
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
                    Level {progress.level} • {Math.round(progress.levelProgress)}% to next level
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
                  <LoadingSpinner />
                ) : progress ? (
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProgressVisualization progress={progress} />
                  </Suspense>
                ) : (
                  <div className="text-center text-gray-500">No progress data available</div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && progress?.milestones && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.milestones.map((milestone) => (
                  <Card key={milestone.id} className="p-4">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {milestone.icon ? (
                          <span className="text-2xl">{milestone.icon}</span>
                        ) : (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        )}
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      </div>
                      <CardDescription>{milestone.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={(milestone.progress / milestone.target) * 100} className="mb-2" />
                      <p className="text-sm text-gray-500">
                        Progress: {Math.round((milestone.progress / milestone.target) * 100)}%
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-gray-500">
                        {milestone.completed ? 'Completed' : 'In Progress'}
                      </p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                {isLoadingLeaderboard ? (
                  <LoadingSpinner />
                ) : leaderboard ? (
                  <Suspense fallback={<LoadingSpinner />}>
                    <Leaderboard refreshInterval={30000} />
                  </Suspense>
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

// Export wrapped component
export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileContent />
    </Suspense>
  );
}

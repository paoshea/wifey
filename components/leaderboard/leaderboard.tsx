'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Crown, Flame, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { LeaderboardEntry, LeaderboardStats as LeaderboardStatsType, leaderboardService } from '@/lib/services/leaderboard-service';

const TIMEFRAMES = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  allTime: 'All Time',
} as const;

type Timeframe = keyof typeof TIMEFRAMES;

function LeaderboardRow({ entry, highlight = false }: { entry: LeaderboardEntry; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center p-4 ${
        highlight ? 'bg-blue-50 rounded-lg' : ''
      }`}
    >
      <div className="flex-shrink-0 w-12 text-center">
        {entry.rank <= 3 ? (
          <div className="inline-flex">
            {entry.rank === 1 && <Trophy className="w-6 h-6 text-yellow-500" />}
            {entry.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
            {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600" />}
          </div>
        ) : (
          <span className="text-gray-500">#{entry.rank}</span>
        )}
      </div>

      <div className="flex-shrink-0 ml-4">
        <Avatar>
          <AvatarImage src={entry.avatarUrl ?? undefined} alt={entry.username} />
          <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="ml-4 flex-grow">
        <div className="font-medium">{entry.username}</div>
        <div className="text-sm text-gray-500">Level {entry.level}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-sm font-medium">{entry.points}</div>
          <div className="text-xs text-gray-500">Points</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium">{entry.contributions}</div>
          <div className="text-xs text-gray-500">Spots</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium">{entry.badges}</div>
          <div className="text-xs text-gray-500">Badges</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium flex items-center">
            <Flame className="w-4 h-4 text-orange-500 mr-1" />
            {entry.streak.current}
          </div>
          <div className="text-xs text-gray-500">Streak</div>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardStats({ stats }: { stats: LeaderboardStatsType }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Contributions</p>
              <p className="text-2xl font-bold">{stats.totalContributions}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Longest Streak</p>
              <p className="text-2xl font-bold">{stats.longestStreak} days</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Leaderboard() {
  const { data: session } = useSession();
  const [timeframe, setTimeframe] = useState<Timeframe>('allTime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStatsType | null>(null);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch leaderboard with stats included
        const response = await leaderboardService.getLeaderboard(timeframe, 1, 10, true);
        setEntries(response.entries);
        setStats(response.stats ?? null);

        // Get user's rank if logged in
        if (session?.user?.id) {
          const userRankData = await leaderboardService.getUserRankContext(session.user.id, timeframe);
          setUserRank(userRankData.surroundingEntries.find(entry => entry.userId === session.user.id) ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe, session?.user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => setTimeframe(timeframe)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && <LeaderboardStats stats={stats} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={timeframe} onValueChange={(value: string) => setTimeframe(value as Timeframe)}>
            <TabsList className="mb-6">
              {Object.entries(TIMEFRAMES).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={timeframe}>
              <div className="space-y-2">
                {entries.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    highlight={entry.userId === session?.user?.id}
                  />
                ))}
              </div>

              {userRank && userRank.rank > 10 && (
                <div className="mt-6 pt-6 border-t">
                  <LeaderboardRow entry={userRank} highlight />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

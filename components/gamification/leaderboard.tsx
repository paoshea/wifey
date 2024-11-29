// components/gamification/leaderboard.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Search, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { TimeFrame, LeaderboardEntry } from '@/lib/gamification/types';
import { getCachedLeaderboard } from '@/lib/services/gamification-service';

interface LeaderboardProps {
  refreshInterval?: number;
}

const timeframes: { value: TimeFrame; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'allTime', label: 'All Time' },
];

const rankColors = {
  1: 'bg-yellow-500',
  2: 'bg-gray-300',
  3: 'bg-amber-600',
};

export function Leaderboard({ refreshInterval = 30000 }: LeaderboardProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeFrame>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('points');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCachedLeaderboard(timeframe);
      setEntries(data.entries);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [timeframe, toast]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, refreshInterval]);

  const filteredEntries = entries.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTopThreeContent = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return rank;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <Select
            value={timeframe}
            onValueChange={(value: TimeFrame) => setTimeframe(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="space-y-4">
            <AnimatePresence>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className={cn(
                      'flex items-center p-4 rounded-lg',
                      index < 3 ? `border-l-4 ${rankColors[entry.rank as keyof typeof rankColors]}` : ''
                    )}>
                      <div className="flex items-center flex-1">
                        <div className="w-8 text-center font-bold">
                          {getTopThreeContent(entry.rank)}
                        </div>
                        <Avatar className="h-10 w-10 mx-4">
                          <AvatarImage src={entry.image || undefined} />
                          <AvatarFallback>
                            {entry.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-500">
                            Level {entry.level}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.points.toLocaleString()} pts</div>
                        <div className="text-sm text-gray-500">
                          {entry.streak.current} day streak
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <AnimatePresence>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                filteredEntries
                  .sort((a, b) => b.contributions - a.contributions)
                  .map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex items-center p-4 rounded-lg border">
                        <div className="flex items-center flex-1">
                          <Avatar className="h-10 w-10 mx-4">
                            <AvatarImage src={entry.image || undefined} />
                            <AvatarFallback>
                              {entry.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{entry.username}</div>
                            <div className="text-sm text-gray-500">
                              Level {entry.level}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {entry.contributions} contributions
                          </div>
                          <div className="text-sm text-gray-500">
                            Last 30 days
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AnimatePresence>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                filteredEntries
                  .sort((a, b) => b.badges - a.badges)
                  .map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex items-center p-4 rounded-lg border">
                        <div className="flex items-center flex-1">
                          <Avatar className="h-10 w-10 mx-4">
                            <AvatarImage src={entry.image || undefined} />
                            <AvatarFallback>
                              {entry.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{entry.username}</div>
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-gray-500">
                                {entry.badges} achievements
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {entry.recentAchievements?.map((achievement, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {achievement.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

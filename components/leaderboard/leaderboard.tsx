// components/leaderboard/leaderboard.tsx

'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { getCachedLeaderboard } from '@/lib/services/gamification-service';
import { LeaderboardEntry, TimeFrame } from '@/lib/gamification/types';

interface LeaderboardProps {
  initialEntries?: LeaderboardEntry[];
  timeframe?: TimeFrame;
}

export function Leaderboard({ initialEntries = [], timeframe = 'weekly' }: LeaderboardProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [loading, setLoading] = useState(false);

  const refreshLeaderboard = async () => {
    setLoading(true);
    try {
      const newEntries = await getCachedLeaderboard(timeframe);
      setEntries(newEntries);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshLeaderboard}
          disabled={loading}
        >
          {loading ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.refresh className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <span className="text-xl font-bold w-8">{index + 1}</span>
              <Avatar user={entry.user} />
              <div>
                <p className="font-medium">{entry.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.points} points
                </p>
              </div>
            </div>
            {entry.rank === 1 && (
              <Icons.trophy className="h-6 w-6 text-yellow-500" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

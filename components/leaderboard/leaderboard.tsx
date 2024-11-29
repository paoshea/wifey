// components/gamification/leaderboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Crown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface LeaderboardUser {
  id: string;
  name: string;
  image: string;
  points: number;
  achievements: {
    type: string;
    title: string;
    metadata: any;
  }[];
}

interface LeaderboardPosition {
  position: number;
  totalUsers: number;
}

export default function Leaderboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeaderboardData();
    }
  }, [session?.user?.id]);

  const fetchLeaderboardData = async () => {
    try {
      const [leaderboardResponse, positionResponse] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/leaderboard/position')
      ]);

      const { users } = await leaderboardResponse.json();
      const position = await positionResponse.json();

      setUsers(users);
      setUserPosition(position);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-6 h-6 text-blue-500" />;
    }
  };

  const getAchievementBadge = (achievement: LeaderboardUser['achievements'][0]) => {
    return (
      <div
        key={achievement.title}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-full"
        title={achievement.title}
      >
        <span>{achievement.metadata.emoji}</span>
        <span className="truncate max-w-[100px]">{achievement.title}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          Leaderboard
        </h2>
        {userPosition && (
          <div className="text-sm text-gray-600">
            Your Rank: {userPosition.position} of {userPosition.totalUsers}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-lg ${
              user.id === session?.user?.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                {getRankIcon(index + 1)}
              </div>
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={user.image || '/default-avatar.png'}
                  alt={user.name || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.points} points</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 max-w-[300px]">
              {user.achievements
                .slice(0, 3)
                .map((achievement) => getAchievementBadge(achievement))}
              {user.achievements.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{user.achievements.length - 3} more
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={fetchLeaderboardData}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh Leaderboard
        </button>
      </div>
    </div>
  );
}

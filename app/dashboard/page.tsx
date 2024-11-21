'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Star, Signal, MapPin, History } from 'lucide-react';
import AchievementDisplay from '@/components/coverage/achievement-display';
import { useGamificationStore } from '@/lib/store/gamification-store';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { achievements, calculateLevel } = useGamificationStore();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {session?.user?.name}!</h1>
        <p className="text-gray-600">
          Track your coverage contributions and achievements
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{calculateLevel()}</div>
                <p className="text-sm text-gray-500">Current Level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Star className="w-5 h-5 mr-2 text-blue-500" />
                  Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{achievements.points}</div>
                <p className="text-sm text-gray-500">Total Points Earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Signal className="w-5 h-5 mr-2 text-green-500" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{achievements.streak.current}🔥</div>
                <p className="text-sm text-gray-500">Day Streak</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Medal className="w-5 h-5 mr-2 text-purple-500" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{achievements.badges.length}</div>
                <p className="text-sm text-gray-500">Badges Earned</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add recent activity list here */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementDisplay />
        </TabsContent>

        <TabsContent value="contributions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Signal className="w-5 h-5 mr-2" />
                Your Coverage Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add contributions map and list here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add activity timeline here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

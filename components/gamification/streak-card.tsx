'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  nextMilestone: number;
  progressToNextMilestone: number;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  nextMilestone,
  progressToNextMilestone,
}: StreakCardProps) {
  const t = useTranslations('gamification');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.flame className="w-5 h-5 text-orange-500" />
          {t('streak.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('streak.current')}</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                {currentStreak}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('streak.days')}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('streak.longest')}</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                {longestStreak}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('streak.days')}
                </span>
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {t('streak.nextMilestone', { days: nextMilestone })}
              </p>
              <p className="text-sm font-medium">{progressToNextMilestone}%</p>
            </div>
            <Progress value={progressToNextMilestone} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

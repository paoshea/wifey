'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';

interface StatsCardProps {
  points: number;
  rank: number;
  totalContributions: number;
  level: number;
}

export function StatsCard({
  points = 0,
  rank = 0,
  totalContributions = 0,
  level = 1,
}: Partial<StatsCardProps>) {
  const t = useTranslations('gamification');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.activity className="w-5 h-5 text-primary" />
          {t('stats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('stats.points')}</p>
            <p className="text-2xl font-bold">{points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('stats.rank')}</p>
            <p className="text-2xl font-bold">#{rank.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('stats.contributions')}</p>
            <p className="text-2xl font-bold">{totalContributions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('stats.level')}</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              {level}
              <span className="text-sm font-normal text-muted-foreground">
                {t('stats.levelLabel')}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

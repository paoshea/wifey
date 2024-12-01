'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Icons;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface AchievementsCardProps {
  achievements: Achievement[];
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const t = useTranslations('gamification');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.trophy className="w-5 h-5 text-yellow-500" />
          {t('achievements.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement) => {
            const Icon = Icons[achievement.icon];
            return (
              <div
                key={achievement.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  achievement.unlocked ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    achievement.unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium truncate">{achievement.name}</h4>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="shrink-0">
                        {t('achievements.unlocked')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.progress !== undefined && achievement.total !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('achievements.progress', {
                        current: achievement.progress,
                        total: achievement.total,
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

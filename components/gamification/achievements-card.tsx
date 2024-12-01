'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface AchievementsCardProps {
  achievements: Achievement[];
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const t = useTranslations('gamification');

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] || Icons.trophy;
    return <IconComponent className="w-4 h-4" />;
  };

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
          {achievements.map((achievement) => (
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
                {getIcon(achievement.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium truncate">{achievement.name}</h4>
                  <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                    {achievement.unlocked ? t('achievements.unlocked') : '🔒'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                {achievement.progress !== undefined && achievement.total !== undefined && (
                  <div className="mt-2">
                    <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('achievements.progress', {
                        current: achievement.progress,
                        total: achievement.total,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, MapPin, Trophy, Wifi, Signal } from 'lucide-react';

export default function NotificationSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('settings.notifications');
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      toast({
        title: t('authRequired'),
        description: t('authRequiredDescription'),
        variant: 'destructive',
      });
    }
  }, [status, router, t, toast]);

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    notifications: {
      coverage: true,
      wifi: true,
      achievements: true,
      updates: true,
      nearby: true,
    },
  });

  const handleToggle = (key: string, category?: string) => {
    if (category) {
      setSettings((prev) => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [key]: !prev[category as keyof typeof prev][key as keyof typeof prev[typeof category]],
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key as keyof typeof prev],
      }));
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save notification settings
      toast({
        title: t('saveSuccess'),
        description: t('saveSuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('saveError'),
        description: t('saveErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('general.title')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('general.push')}</p>
                <p className="text-sm text-muted-foreground">{t('general.pushDescription')}</p>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={() => handleToggle('pushEnabled')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('general.email')}</p>
                <p className="text-sm text-muted-foreground">{t('general.emailDescription')}</p>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={() => handleToggle('emailEnabled')}
              />
            </div>
          </div>
        </Card>

        {/* Notification Categories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('categories.title')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Signal className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{t('categories.coverage')}</p>
                  <p className="text-sm text-muted-foreground">{t('categories.coverageDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.coverage}
                onCheckedChange={() => handleToggle('coverage', 'notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">{t('categories.wifi')}</p>
                  <p className="text-sm text-muted-foreground">{t('categories.wifiDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.wifi}
                onCheckedChange={() => handleToggle('wifi', 'notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">{t('categories.achievements')}</p>
                  <p className="text-sm text-muted-foreground">{t('categories.achievementsDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.achievements}
                onCheckedChange={() => handleToggle('achievements', 'notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{t('categories.nearby')}</p>
                  <p className="text-sm text-muted-foreground">{t('categories.nearbyDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.nearby}
                onCheckedChange={() => handleToggle('nearby', 'notifications')}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="w-full sm:w-auto">
            {t('saveButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from 'components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'components/ui/card';
import { Label } from 'components/ui/label';
import { Switch } from 'components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Icons } from 'components/ui/icons';
import { useToast } from 'components/ui/use-toast';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement settings save logic
      toast({
        title: t('success'),
        description: t('settingsSaved'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('settingsError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('appearance.title')}</CardTitle>
            <CardDescription>{t('appearance.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('appearance.theme')}</Label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value)}
                defaultValue="system"
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('appearance.selectTheme')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('appearance.light')}</SelectItem>
                  <SelectItem value="dark">{t('appearance.dark')}</SelectItem>
                  <SelectItem value="system">{t('appearance.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.title')}</CardTitle>
            <CardDescription>{t('notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">{t('notifications.enable')}</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('account.title')}</CardTitle>
            <CardDescription>{t('account.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session?.user && (
              <div className="space-y-1">
                <Label>{t('account.email')}</Label>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.save className="mr-2 h-4 w-4" />
            )}
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}

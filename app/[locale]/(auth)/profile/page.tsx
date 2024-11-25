'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const { locale } = useTranslations();

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input id="name" placeholder={t('namePlaceholder')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input id="email" type="email" placeholder={t('emailPlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phoneLabel')}</Label>
              <Input id="phone" type="tel" placeholder={t('phonePlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('locationLabel')}</Label>
              <Input id="location" placeholder={t('locationPlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notifications">{t('notificationsLabel')}</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="notifications" 
                  type="checkbox" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-gray-600">
                  {t('notificationsDescription')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard`}>{t('cancel')}</Link>
            </Button>
            <Button>{t('save')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Signal, Wifi } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="w-5 h-5" />
              {t('cellularTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{t('cellularDescription')}</p>
            <Button asChild>
              <Link href={`/${locale}/coverage-map`}>{t('viewCoverage')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              {t('wifiTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{t('wifiDescription')}</p>
            <Button asChild>
              <Link href={`/${locale}/wifi-map`}>{t('findWifi')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('nearbyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{t('nearbyDescription')}</p>
            <Button asChild>
              <Link href={`/${locale}/nearby`}>{t('exploreNearby')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

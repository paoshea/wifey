'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { LocationTracker } from '@/components/location/LocationTracker';
import { GPSLocationMap } from '@/components/location/GPSLocationMap';
import { LocationFinder } from '@/components/location/LocationFinder';

// Dynamically import the MapSearch component to avoid SSR issues with Leaflet
const MapSearch = dynamic(
  () => import('@/components/map/map-search').then((mod) => mod.MapSearch),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    ),
  }
);

export default function ReportPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [location, setLocation] = useState({ lat: 0, lng: 0, name: '' });
  const [type, setType] = useState('wifi');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [speed, setSpeed] = useState('');

  const handleLocationFound = (loc: { lat: number; lng: number; name: string }) => {
    setLocation(loc);
    if (loc.name && !name) {
      setName(loc.name);
    }
  };

  const handleLocationUpdate = (loc: { lat: number; lng: number }) => {
    setLocation(prev => ({ ...prev, ...loc }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!location.lat || !location.lng || !name) return;

    setIsLoading(true);

    try {
      // TODO: Implement the API call to save the report
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call

      setShowSuccess(true);
      toast({
        title: t('report.success.title'),
        description: t('report.success.description'),
        variant: 'default',
      });

      // Clear form
      setLocation({ lat: 0, lng: 0, name: '' });
      setName('');
      setNotes('');
      setSpeed('');
      setType('wifi');
    } catch (error) {
      toast({
        title: t('report.error.title'),
        description: t('report.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">{t('report.success.thanksTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-lg text-muted-foreground">
              {t('report.success.thanksDescription')}
            </p>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                {t('report.success.joinTitle')}
              </h3>
              <p className="text-blue-600 mb-4">
                {t('report.success.joinDescription')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/dashboard`}>
                  {t('report.success.joinButton')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{t('report.title')}</CardTitle>
            <CardDescription>{t('report.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('report.form.location')}</Label>
                  <MapSearch onLocationFound={handleLocationFound} />
                </div>
                <div className="space-y-2">
                  <Label>{t('report.form.currentLocation')}</Label>
                  <LocationTracker onLocationUpdate={handleLocationUpdate} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('report.coverageType')}</Label>
                <RadioGroup
                  defaultValue={type}
                  onValueChange={setType}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wifi" id="wifi" />
                    <Label htmlFor="wifi" className="flex items-center">
                      <Icons.wifi className="mr-2 h-4 w-4" />
                      {t('report.wifi')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cellular" id="cellular" />
                    <Label htmlFor="cellular" className="flex items-center">
                      <Icons.signal className="mr-2 h-4 w-4" />
                      {t('report.cellular')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('report.locationName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('report.locationNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed">{t('report.speed')}</Label>
                <Input
                  id="speed"
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  placeholder={t('report.speedPlaceholder')}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('report.notes')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('report.notesPlaceholder')}
                  rows={3}
                />
              </div>
              <div>
                <Label>{t('form.location')}</Label>
                <div className="mt-2 space-y-4">
                  <LocationFinder
                    onLocationFound={({ lat, lng }: { lat: number; lng: number }) => {
                      setLocation(prev => ({ ...prev, lat, lng }));
                    }}
                  />
                  <div className="h-[300px]">
                    <GPSLocationMap
                      onLocationUpdate={handleLocationUpdate}
                      className="w-full h-full"
                    />
                  </div>
                  {location && (
                    <p className="text-sm text-gray-600">
                      {t('form.locationSelected')}: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading || !location.lat || !location.lng || !name}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {t('report.submitting')}
                </>
              ) : (
                <>
                  <Icons.save className="mr-2 h-4 w-4" />
                  {t('report.submit')}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

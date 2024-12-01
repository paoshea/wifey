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

// Dynamically import the MapSearch component to avoid SSR issues with Leaflet
const MapSearch = dynamic(
  () => import('@/components/map/map-search').then(mod => mod.MapSearch),
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

  const handleSubmit = async (e: React.FormEvent) => {
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
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href={`/${locale}/auth/signup`}>
                    <Icons.user className="mr-2 h-4 w-4" />
                    {t('report.success.signUp')}
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowSuccess(false);
                  router.push(`/${locale}/map?lat=${location.lat}&lng=${location.lng}`);
                }}>
                  <Icons.map className="mr-2 h-4 w-4" />
                  {t('report.success.viewMap')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('report.title')}</CardTitle>
          <CardDescription>{t('report.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="reportForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Map Selection */}
            <div className="space-y-2">
              <Label>{t('report.selectLocation')}</Label>
              <MapSearch onLocationFound={handleLocationFound} />
            </div>

            {/* Coverage Type */}
            <div className="space-y-2">
              <Label>{t('report.coverageType')}</Label>
              <RadioGroup
                defaultValue="wifi"
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

            {/* Location Name */}
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

            {/* Speed */}
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

            {/* Notes */}
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
          </form>
        </CardContent>
        <CardFooter>
          <Button
            form="reportForm"
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
      </Card>
    </div>
  );
}

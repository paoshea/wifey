'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Wifi, Signal, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView, { MapPoint } from '@/components/map/map-view';

export default function ExplorePage() {
  const t = useTranslations('explore');
  const [activeLayer, setActiveLayer] = useState<'wifi' | 'coverage' | 'both'>('both');
  const [searchRadius, setSearchRadius] = useState(5);

  // Sample data - replace with real data from your backend
  const samplePoints: MapPoint[] = [
    {
      id: '1',
      type: 'wifi',
      name: 'Coffee Shop WiFi',
      coordinates: [9.9281, -84.0907] as [number, number],
      details: {
        speed: '50 Mbps',
        type: 'free',
        provider: 'Local Cafe'
      }
    },
    {
      id: '2',
      type: 'coverage',
      name: 'High Coverage Zone',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        strength: 'Excellent',
        provider: 'Movistar'
      }
    }
  ];

  const handlePointSelect = (point: MapPoint) => {
    console.log('Selected point:', point);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <MapPin className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          <div className="max-w-2xl mx-auto flex gap-4">
            <Input
              placeholder={t('search.placeholder')}
              className="h-12"
            />
            <Button size="lg" className="px-8">
              <Search className="w-5 h-5 mr-2" />
              {t('search.button')}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">{t('map.title')}</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <MapView
                points={samplePoints}
                activeLayer={activeLayer}
                onPointSelect={handlePointSelect}
              />
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('filters.title')}</h2>
              <div className="space-y-4">
                <Button
                  variant={activeLayer === 'coverage' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveLayer('coverage')}
                >
                  <Signal className="w-5 h-5 mr-2" />
                  {t('filters.cellular')}
                </Button>
                <Button
                  variant={activeLayer === 'wifi' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveLayer('wifi')}
                >
                  <Wifi className="w-5 h-5 mr-2" />
                  {t('filters.wifi')}
                </Button>
                <Button
                  variant={activeLayer === 'both' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveLayer('both')}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  {t('filters.all')}
                </Button>
              </div>
              <hr className="my-4" />
              <div className="space-y-4">
                <h3 className="font-medium">{t('filters.range.title')}</h3>
                <Input
                  type="range"
                  min="0"
                  max="10"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0 km</span>
                  <span>{searchRadius} km</span>
                  <span>10 km</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('contribute.title')}</h2>
              <p className="text-gray-600 mb-4">{t('contribute.description')}</p>
              <Button className="w-full">
                {t('contribute.button')}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Wifi, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView from '@/components/map/map-view';

export default function WifiPage() {
  const t = useTranslations('wifi');
  const [searchRadius, setSearchRadius] = useState(5);

  // Sample wifi data - replace with real data from backend
  const samplePoints = [
    {
      id: '1',
      type: 'wifi' as const,
      name: 'Coffee Shop WiFi',
      coordinates: [9.9281, -84.0907],
      details: {
        speed: '50 Mbps',
        type: 'free' as const,
        provider: 'Local Cafe'
      }
    },
    {
      id: '2',
      type: 'wifi' as const,
      name: 'Hotel WiFi',
      coordinates: [9.9290, -84.0920],
      details: {
        speed: '100 Mbps',
        type: 'private' as const,
        provider: 'Hotel Network'
      }
    }
  ];

  const handlePointSelect = (point: any) => {
    console.log('Selected wifi point:', point);
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
            <Wifi className="w-12 h-12 text-blue-600" />
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
                activeLayer="wifi"
                onPointSelect={handlePointSelect}
              />
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('filters.title')}</h2>
              <div className="space-y-4">
                <h3 className="font-medium">{t('filters.type.title')}</h3>
                <div className="space-y-2">
                  {['Free', 'Private', 'Public'].map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={type}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={type} className="ml-2 block text-sm text-gray-600">
                        {type}
                      </label>
                    </div>
                  ))}
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
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('stats.title')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('stats.total')}</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('stats.today')}</span>
                  <span className="font-semibold">28</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('stats.free')}</span>
                  <span className="font-semibold">843</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

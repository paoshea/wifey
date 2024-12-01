'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Signal, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView, { MapPoint } from '@/components/map/map-view';
import { AddPoint } from '@/components/points/add-point';
import { MapSearch } from '@/components/map/map-search';

export default function CoveragePage() {
  const t = useTranslations('coverage');
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);

  // Sample coverage data - replace with real data from backend
  const samplePoints: MapPoint[] = [
    {
      id: '1',
      type: 'coverage',
      name: 'High Coverage Zone',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        strength: 'Excellent',
        provider: 'Movistar'
      }
    },
    {
      id: '2',
      type: 'coverage',
      name: 'Medium Coverage Area',
      coordinates: [9.9281, -84.0907] as [number, number],
      details: {
        strength: 'Good',
        provider: 'Kolbi'
      }
    }
  ];

  const handlePointSelect = (point: MapPoint) => {
    console.log('Selected coverage point:', point);
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
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center mb-6">
              <Signal className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center">
              {t('subtitle')}
            </p>
            <AddPoint type="coverage" />
            <MapSearch 
              onLocationFound={({ lat, lng }) => {
                setMapCenter([lat, lng]);
                setMapZoom(15);
              }}
              searchRadius={searchRadius}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">{t('map.title')}</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <MapView
                points={samplePoints}
                activeLayer="coverage"
                center={mapCenter}
                zoom={mapZoom}
              />
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('filters.title')}</h2>
              <div className="space-y-4">
                <h3 className="font-medium">{t('filters.providers.title')}</h3>
                <div className="space-y-2">
                  {['Movistar', 'Kolbi', 'Claro'].map((provider) => (
                    <div key={provider} className="flex items-center">
                      <input
                        type="checkbox"
                        id={provider}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={provider} className="ml-2 block text-sm text-gray-600">
                        {provider}
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
                  <span className="font-semibold">2,345</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('stats.today')}</span>
                  <span className="font-semibold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('stats.contributors')}</span>
                  <span className="font-semibold">156</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Signal, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView from '@/components/map/map-view';
import type { MapPoint } from '@/components/map/map-view';
import { MapSearch } from '@/components/map/map-search';

export default function ExplorePage() {
  const t = useTranslations('explore');
  const [activeLayer, setActiveLayer] = useState<'wifi' | 'coverage' | 'both'>('both');
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);

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
      name: 'Strong Signal Spot',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        strength: '4G',
        provider: 'Movistar',
        quality: 'Excellent'
      }
    }
  ];

  const handlePointSelect = (point: MapPoint) => {
    console.log('Selected point:', point);
  };

  const handleRadiusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value);
    setSearchRadius(newRadius);
    // Adjust zoom level based on radius
    const newZoom = Math.max(15 - Math.log2(newRadius), 10);
    setMapZoom(Math.round(newZoom));
  }, []);

  const handleLocationFound = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    setMapCenter([lat, lng]);
    // Adjust zoom based on current search radius
    const newZoom = Math.max(15 - Math.log2(searchRadius), 10);
    setMapZoom(Math.round(newZoom));
  }, [searchRadius]);

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
            <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center">
              {t('description')}
            </p>
            <MapSearch 
              onLocationFound={handleLocationFound}
              searchRadius={searchRadius}
            />

            <div className="flex gap-4">
              <Button
                variant={activeLayer === 'both' ? 'default' : 'outline'}
                onClick={() => setActiveLayer('both')}
                className="flex items-center gap-2"
              >
                <Signal className="w-4 h-4" />
                <Wifi className="w-4 h-4" />
                {t('allPoints')}
              </Button>
              <Button
                variant={activeLayer === 'coverage' ? 'default' : 'outline'}
                onClick={() => setActiveLayer('coverage')}
                className="flex items-center gap-2"
              >
                <Signal className="w-4 h-4" />
                {t('coveragePoints')}
              </Button>
              <Button
                variant={activeLayer === 'wifi' ? 'default' : 'outline'}
                onClick={() => setActiveLayer('wifi')}
                className="flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                {t('wifiPoints')}
              </Button>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>0 km</span>
                <span>{searchRadius} km</span>
                <span>10 km</span>
              </div>
              <Input
                type="range"
                min="0"
                max="10"
                value={searchRadius}
                onChange={handleRadiusChange}
                className="w-full"
              />
              <p className="text-sm text-gray-500 text-center">
                {t('searchRadius', { radius: searchRadius })}
              </p>
            </div>
          </div>
        </motion.div>

        <Card className="p-6">
          <div className="h-[600px] w-full">
            <MapView
              points={samplePoints}
              activeLayer={activeLayer}
              center={mapCenter}
              zoom={mapZoom}
              onPointSelect={handlePointSelect}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

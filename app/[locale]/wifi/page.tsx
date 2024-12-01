'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import MapView from '@/components/map/map-view';
import type { MapPoint } from '@/components/map/map-view';
import { AddPoint } from '@/components/points/add-point';
import { MapSearch } from '@/components/map/map-search';

export default function WifiPage() {
  const t = useTranslations('wifi');
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);

  // Sample wifi data - replace with real data from backend
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
      type: 'wifi',
      name: 'Hotel WiFi',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        speed: '100 Mbps',
        type: 'restricted',
        provider: 'Hotel Network'
      }
    }
  ];

  const handlePointSelect = (point: MapPoint) => {
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
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center">
              {t('subtitle')}
            </p>
            <AddPoint type="wifi" />
            <MapSearch 
              onLocationFound={({ lat, lng }) => {
                setMapCenter([lat, lng]);
                setMapZoom(15);
              }}
              searchRadius={searchRadius}
            />
          </div>
        </motion.div>

        <Card className="p-6">
          <div className="h-[600px] w-full">
            <MapView
              points={samplePoints}
              activeLayer="wifi"
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

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import MapView from '@/components/map/map-view';
import type { MapPoint } from '@/components/map/map-view';
import { AddPoint } from '@/components/points/add-point';
import { MapSearch } from '@/components/map/map-search';
import { LocationFinder } from '@/components/location/LocationFinder';

interface CurrentLocation {
  lat: number;
  lng: number;
}

export default function CellularPage() {
  const t = useTranslations('cellular');
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // Sample cellular data - replace with real data from backend
  const samplePoints: MapPoint[] = [
    {
      id: '1',
      type: 'cellular',
      name: 'Cell Tower A',
      coordinates: [9.9281, -84.0907] as [number, number],
      details: {
        provider: 'Movistar',
        technology: '4G LTE',
        band: 'Band 7'
      }
    },
    {
      id: '2',
      type: 'cellular',
      name: 'Cell Tower B',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        provider: 'Claro',
        technology: '5G',
        band: 'Band n78'
      }
    }
  ];

  const handlePointSelect = (point: MapPoint) => {
    setSelectedPoint(point);
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
            <Phone className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center">
              {t('subtitle')}
            </p>
            <AddPoint type="cellular" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="h-[600px] w-full">
                <MapView
                  points={samplePoints}
                  activeLayer="cellular"
                  center={mapCenter}
                  zoom={mapZoom}
                  onPointSelect={handlePointSelect}
                />
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <MapSearch 
              onLocationFound={({ lat, lng }) => {
                setMapCenter([lat, lng]);
                setMapZoom(15);
              }}
              searchRadius={searchRadius}
            />
            <LocationFinder 
              onLocationFound={({ lat, lng }) => {
                setCurrentLocation({ lat, lng });
                setMapCenter([lat, lng]);
                setMapZoom(15);
              }}
            />
            {selectedPoint && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">{t('cellularDetails')}</h3>
                <div className="space-y-2 text-sm">
                  <p>{t('provider')}: {selectedPoint.details?.provider}</p>
                  <p>{t('technology')}: {selectedPoint.details?.technology}</p>
                  <p>{t('band')}: {selectedPoint.details?.band}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

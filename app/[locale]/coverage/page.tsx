'use client';

import { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Signal, Wifi, Filter, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import MapView from '@/components/map/map-view';
import type { MapPoint } from '@/components/map/map-view';
import { AddPoint } from '@/components/points/add-point';
import { MapSearch } from '@/components/map/map-search';
import { toast } from '@/components/ui/use-toast';

interface CurrentLocation {
  lat: number;
  lng: number;
}

export default function CoveragePage() {
  const t = useTranslations('coverage');
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showWifi, setShowWifi] = useState(true);
  const [showCellular, setShowCellular] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showPointDetails, setShowPointDetails] = useState(false);

  // Sample providers - replace with real data from backend
  const providers = [
    { id: 'all', name: t('allProviders') },
    { id: 'movistar', name: 'Movistar' },
    { id: 'kolbi', name: 'Kölbi' },
    { id: 'claro', name: 'Claro' },
  ];

  // Sample combined coverage data - wrapped in useMemo
  const samplePoints = useMemo<MapPoint[]>(() => [
    {
      id: '1',
      type: 'coverage',
      name: 'Strong Signal Spot',
      coordinates: [9.9281, -84.0907] as [number, number],
      details: {
        strength: '4G',
        provider: 'Movistar'
      }
    },
    {
      id: '2',
      type: 'wifi',
      name: 'Coffee Shop WiFi',
      coordinates: [9.9290, -84.0920] as [number, number],
      details: {
        type: 'free',
        speed: '50 Mbps',
        provider: 'Public WiFi'
      }
    }
  ], []); // Empty dependency array since this data is static

  const [filteredPoints, setFilteredPoints] = useState<MapPoint[]>(samplePoints);

  // Filter points based on current settings
  useEffect(() => {
    const filtered = samplePoints.filter(point => {
      if (!showWifi && point.type === 'wifi') return false;
      if (!showCellular && point.type === 'coverage') return false;
      if (selectedProvider !== 'all' && point.details.provider !== selectedProvider) return false;
      return true;
    });
    setFilteredPoints(filtered);
  }, [showWifi, showCellular, selectedProvider, samplePoints]);

  const handleLocationFound = ({ lat, lng, name }: { lat: number; lng: number; name: string }) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
    setCurrentLocation({ lat, lng });
    toast({
      title: t('locationFound'),
      description: name
    });
  };

  const handleFindMyLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationFound({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: t('currentLocation')
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: t('locationError'),
            description: t('locationErrorDesc'),
            variant: 'destructive'
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        title: t('locationError'),
        description: t('browserLocationError'),
        variant: 'destructive'
      });
      setIsLocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Signal className="w-8 h-8 text-blue-600" />
            <Wifi className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          <div className="mt-6">
            <AddPoint type="coverage" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-wifi"
                      checked={showWifi}
                      onCheckedChange={setShowWifi}
                    />
                    <Label htmlFor="show-wifi">
                      <Wifi className="h-4 w-4 inline mr-1" />
                      {t('showWifi')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-cellular"
                      checked={showCellular}
                      onCheckedChange={setShowCellular}
                    />
                    <Label htmlFor="show-cellular">
                      <Signal className="h-4 w-4 inline mr-1" />
                      {t('showCellular')}
                    </Label>
                  </div>
                </div>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('selectProvider')} />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[600px] w-full">
                <MapView
                  points={filteredPoints}
                  activeLayer="both"
                  center={mapCenter}
                  zoom={mapZoom}
                  onPointSelect={(point) => {
                    setSelectedPoint(point);
                    setShowPointDetails(true);
                  }}
                  autoLocate={false}
                  selectedLocation={currentLocation}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <MapSearch
                  onLocationFound={handleLocationFound}
                  searchRadius={searchRadius}
                  onRadiusChange={setSearchRadius}
                />

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleFindMyLocation}
                    disabled={isLocating}
                    className="w-full"
                  >
                    {isLocating ? (
                      <MapPin className="h-4 w-4 mr-2 animate-pulse" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {t('findMyLocation')}
                  </Button>
                </div>

                {selectedPoint && showPointDetails && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{t('pointDetails')}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPointDetails(false)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {selectedPoint.type === 'wifi' ? (
                          <Wifi className="h-4 w-4" />
                        ) : (
                          <Signal className="h-4 w-4" />
                        )}
                        <span className="font-medium">{selectedPoint.name}</span>
                      </div>

                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-500">{t('provider')}:</span>{' '}
                          {selectedPoint.details.provider}
                        </p>
                        {selectedPoint.type === 'wifi' && (
                          <p>
                            <span className="text-gray-500">{t('speed')}:</span>{' '}
                            {selectedPoint.details.speed}
                          </p>
                        )}
                        {selectedPoint.type === 'coverage' && (
                          <p>
                            <span className="text-gray-500">{t('strength')}:</span>{' '}
                            {selectedPoint.details.strength}
                          </p>
                        )}
                        <p>
                          <span className="text-gray-500">{t('coordinates')}:</span>{' '}
                          {selectedPoint.coordinates[0].toFixed(6)}, {selectedPoint.coordinates[1].toFixed(6)}
                        </p>
                        {selectedPoint.details && selectedPoint.details.timestamp && (
                          <p>
                            <span className="text-gray-500">{t('lastUpdated')}:</span>{' '}
                            {selectedPoint.details.timestamp ? new Date(selectedPoint.details.timestamp).toLocaleString() : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

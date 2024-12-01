'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Save, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OfflineGPSMap } from '@/components/location/OfflineGPSMap';
import { OfflineMap } from '@/components/map/offline-map';
import { DistanceCalculator } from '@/components/location/DistanceCalculator';
import { LocationFinder } from '@/components/location/LocationFinder';
import { OfflineLocationService } from '@/lib/location/OfflineLocationService';
import { ReportForm } from '@/components/report/ReportForm';
import type { MapPoint } from '@/components/map/map-view';

interface CurrentLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

interface SavedLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  details?: {
    provider?: string;
    strength?: string;
    quality?: string;
  };
}

export default function OfflinePage() {
  const t = useTranslations();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [coveragePoints, setCoveragePoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Load saved locations from service
    const locationService = OfflineLocationService.getInstance();
    const history = locationService.getLocationHistory();
    setSavedLocations(history.map(loc => ({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp
    })));

    // Convert saved locations to map points
    const points = history.map(loc => ({
      id: loc.timestamp.toString(),
      type: 'coverage',
      name: `Point ${new Date(loc.timestamp).toLocaleString()}`,
      coordinates: [loc.coords.latitude, loc.coords.longitude] as [number, number],
      details: {
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp
      }
    }));
    setCoveragePoints(points);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleLocationUpdate = (location: CurrentLocation) => {
    setCurrentLocation(location);
  };

  const handleSaveLocation = () => {
    if (currentLocation) {
      const newLocation: SavedLocation = {
        ...currentLocation,
        timestamp: Date.now()
      };
      setSavedLocations(prev => [...prev, newLocation]);
      
      // Add to coverage points
      const newPoint: MapPoint = {
        id: newLocation.timestamp.toString(),
        type: 'coverage',
        name: `Point ${new Date(newLocation.timestamp).toLocaleString()}`,
        coordinates: [newLocation.lat, newLocation.lng],
        details: {
          accuracy: newLocation.accuracy,
          timestamp: newLocation.timestamp
        }
      };
      setCoveragePoints(prev => [...prev, newPoint]);
    }
  };

  const handleUploadLocations = async () => {
    if (!isOnline) {
      return;
    }
    // TODO: Implement location upload to backend
    console.log('Uploading locations:', savedLocations);
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
          <div className="flex items-center justify-center mb-4">
            {isOnline ? (
              <Wifi className="w-12 h-12 text-blue-600" />
            ) : (
              <WifiOff className="w-12 h-12 text-orange-600" />
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{t('navigation.offline')}</h1>
          <p className="mt-4 text-xl text-gray-600">{t('location.tracking.gps')}</p>
          <Badge 
            variant={isOnline ? 'default' : 'secondary'}
            className="mt-4"
          >
            {isOnline ? t('location.status.online') : t('location.status.offline')}
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <OfflineGPSMap
                onLocationUpdate={handleLocationUpdate}
                className="mb-6"
              />
              <OfflineMap
                currentLocation={currentLocation}
                coveragePoints={coveragePoints}
                className="w-full"
              />
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveLocation}
                disabled={!currentLocation}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {t('location.actions.save')}
              </Button>
              <Button
                onClick={handleUploadLocations}
                disabled={!isOnline || savedLocations.length === 0}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('location.actions.upload')}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="locations" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="locations">{t('location.savedLocations')}</TabsTrigger>
                <TabsTrigger value="report">{t('location.report')}</TabsTrigger>
              </TabsList>
              <TabsContent value="locations">
                <Card className="p-4">
                  <div className="space-y-4">
                    <LocationFinder 
                      onLocationFound={handleLocationUpdate}
                    />
                    {savedLocations.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium">{t('location.savedLocations')}</h3>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {savedLocations.map((loc, index) => (
                            <Card
                              key={loc.timestamp}
                              className={`p-3 cursor-pointer transition-colors ${
                                selectedLocation?.timestamp === loc.timestamp
                                  ? 'bg-muted'
                                  : ''
                              }`}
                              onClick={() => setSelectedLocation(loc)}
                            >
                              <p className="font-medium">
                                {t('location.locationDetails')} {index + 1}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(loc.timestamp).toLocaleString()}
                              </p>
                              <p className="text-sm">
                                {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentLocation && selectedLocation && (
                      <DistanceCalculator
                        currentLocation={currentLocation}
                        selectedPoint={selectedLocation}
                      />
                    )}
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="report">
                <Card className="p-4">
                  <ReportForm
                    initialLocation={currentLocation}
                    offlineMode={!isOnline}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

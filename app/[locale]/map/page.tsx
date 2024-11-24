'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wifi, Signal, Layers, Search, Info, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Import MapView dynamically to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map/map-view'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

type MapLayer = 'wifi' | 'coverage' | 'both';
type MapPoint = {
  id: string;
  type: 'wifi' | 'coverage';
  name: string;
  coordinates: [number, number];
  details: {
    strength?: string;
    speed?: string;
    provider?: string;
    type?: 'free' | 'paid' | 'restricted';
  };
};

// Mock data for demonstration
const mockPoints: MapPoint[] = [
  {
    id: '1',
    type: 'wifi',
    name: 'Central Park Café',
    coordinates: [9.9281, -84.0907],
    details: {
      speed: '50 Mbps',
      type: 'free'
    }
  },
  {
    id: '2',
    type: 'coverage',
    name: 'Downtown Coverage Point',
    coordinates: [9.9324, -84.0795],
    details: {
      strength: '4G/LTE',
      provider: 'Movistar'
    }
  },
  {
    id: '3',
    type: 'wifi',
    name: 'Library WiFi',
    coordinates: [9.9300, -84.0850],
    details: {
      speed: '100 Mbps',
      type: 'free'
    }
  }
];

export default function Map() {
  const t = useTranslations('Map');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);

  useEffect(() => {
    // Request user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const filterPoints = (points: MapPoint[]) => {
    return points.filter(point => {
      const matchesSearch = point.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLayer = activeLayer === 'both' || point.type === activeLayer;
      return matchesSearch && matchesLayer;
    });
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  const PointDetails = ({ point }: { point: MapPoint }) => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              {point.type === 'wifi' ? (
                <Wifi className="w-5 h-5 text-blue-500" />
              ) : (
                <Signal className="w-5 h-5 text-green-500" />
              )}
              <h3 className="text-lg font-semibold">{point.name}</h3>
            </div>
            <div className="mt-2 space-y-1">
              {point.details.speed && (
                <p className="text-sm text-gray-600">Speed: {point.details.speed}</p>
              )}
              {point.details.strength && (
                <p className="text-sm text-gray-600">Strength: {point.details.strength}</p>
              )}
              {point.details.provider && (
                <p className="text-sm text-gray-600">Provider: {point.details.provider}</p>
              )}
              {point.details.type && (
                <p className="text-sm text-gray-600">
                  Type: {point.details.type.charAt(0).toUpperCase() + point.details.type.slice(1)}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Implement directions */}}
          >
            <Navigation2 className="w-4 h-4 mr-2" />
            {t('getDirections')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCenterOnUser}
                  >
                    <Navigation2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('centerOnMe')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Layers className="w-4 h-4 mr-2" />
                  {t('layers')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t('showOnMap')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveLayer('both')}>
                  {t('allPoints')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveLayer('wifi')}>
                  <Wifi className="w-4 h-4 mr-2 text-blue-500" />
                  {t('wifiOnly')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveLayer('coverage')}>
                  <Signal className="w-4 h-4 mr-2 text-green-500" />
                  {t('coverageOnly')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="w-4 h-4 mr-2" />
                  {t('legend')}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('mapLegend')}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-5 h-5 text-blue-500" />
                    <span>{t('wifiPoint')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Signal className="w-5 h-5 text-green-500" />
                    <span>{t('coveragePoint')}</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              className="pl-10"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full h-[600px] bg-gray-100 relative">
            <div className="absolute inset-0">
              <MapView
                points={filterPoints(mockPoints)}
                activeLayer={activeLayer}
                onPointSelect={setSelectedPoint}
                center={mapCenter}
                zoom={13}
              />
            </div>
            {selectedPoint && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <PointDetails point={selectedPoint} />
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

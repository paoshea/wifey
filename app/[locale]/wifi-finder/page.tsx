'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Wifi, List, Map as MapIcon, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type ViewMode = 'list' | 'map';
type WifiSpot = {
  id: string;
  name: string;
  address: string;
  type: 'free' | 'paid' | 'restricted';
  speed?: string;
  distance: string;
  rating: number;
};

const mockWifiSpots: WifiSpot[] = [
  {
    id: '1',
    name: 'Central Park Café',
    address: 'Av. Central, San José',
    type: 'free',
    speed: '50 Mbps',
    distance: '0.2 km',
    rating: 4.5
  },
  {
    id: '2',
    name: 'Biblioteca Nacional',
    address: 'Calle 15, San José',
    type: 'free',
    distance: '0.5 km',
    rating: 4.0
  },
  {
    id: '3',
    name: 'Plaza de la Cultura',
    address: 'Av. 2, San José',
    type: 'free',
    speed: '25 Mbps',
    distance: '0.8 km',
    rating: 4.2
  }
];

export default function WifiFinder() {
  const t = useTranslations('WifiFinder');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filterSpots = (spots: WifiSpot[]) => {
    return spots.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          spot.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || spot.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  const filteredSpots = filterSpots(mockWifiSpots);

  const WifiSpotCard = ({ spot }: { spot: WifiSpot }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{spot.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{spot.address}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="inline-flex items-center text-sm text-gray-600">
                  <Wifi className="w-4 h-4 mr-1 text-blue-500" />
                  {spot.type === 'free' ? t('free') : spot.type === 'paid' ? t('paid') : t('restricted')}
                </span>
                {spot.speed && (
                  <span className="text-sm text-gray-600">{spot.speed}</span>
                )}
                <span className="text-sm text-gray-600">{spot.distance}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(spot.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {/* TODO: Implement directions */}}
              >
                {t('getDirections')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-1" />
              {t('listView')}
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="w-4 h-4 mr-1" />
              {t('mapView')}
            </Button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {t('filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedType('all')}>
                {t('allTypes')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('free')}>
                {t('freeOnly')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('paid')}>
                {t('paidOnly')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsContent value="list" className="space-y-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {filteredSpots.map((spot) => (
                <WifiSpotCard key={spot.id} spot={spot} />
              ))}
            </motion.div>
          </TabsContent>
          <TabsContent value="map">
            <Card className="w-full h-[600px] bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">{t('mapComingSoon')}</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

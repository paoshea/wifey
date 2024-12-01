'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';

// Import MapView dynamically to avoid SSR issues
const MapView = dynamic(() => import('./map-view'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface MapSearchProps {
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  searchRadius?: number;
  onRadiusChange?: (radius: number) => void;
}

export function MapSearch({ onLocationFound, searchRadius = 5, onRadiusChange }: MapSearchProps) {
  const t = useTranslations('map');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(searchRadius);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: t('search.error'),
        description: t('search.emptyQuery'),
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Using Nominatim for geocoding (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const newLocation = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          name: location.display_name,
        };
        setSelectedLocation(newLocation);
        onLocationFound(newLocation);
        toast({
          title: t('search.success'),
          description: t('search.locationFound', { location: location.display_name }),
        });
      } else {
        toast({
          title: t('search.error'),
          description: t('search.noResults'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: t('search.error'),
        description: t('search.failed'),
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setSelectedLocation(latlng);
    // Reverse geocode to get the location name
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          onLocationFound({
            ...latlng,
            name: data.display_name
          });
          setSearchQuery(data.display_name);
        }
      })
      .catch(error => {
        console.error('Reverse geocoding error:', error);
        onLocationFound({
          ...latlng,
          name: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
        });
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 w-full max-w-2xl">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('search.placeholder')}
          className="h-12"
          disabled={isSearching}
        />
        <Button
          size="lg"
          className="px-8"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              {t('search.button')}
            </>
          )}
        </Button>
      </div>
      
      <div className="w-full h-[400px] rounded-lg overflow-hidden border">
        <MapView
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
          onMapClick={handleMapClick}
          zoom={15}
          points={selectedLocation ? [{
            id: 'selected',
            type: 'wifi',
            name: searchQuery || 'Selected Location',
            coordinates: [selectedLocation.lat, selectedLocation.lng],
            details: {}
          }] : []}
        />
      </div>
    </div>
  );
}

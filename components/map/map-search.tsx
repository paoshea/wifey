'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2, Crosshair } from 'lucide-react';
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
  const [isLocating, setIsLocating] = useState(false);

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

  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleMapClick(latlng);
          setIsLocating(false);
          toast({
            title: t('search.locationFound'),
            description: t('search.usingCurrentLocation'),
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: t('search.error'),
            description: t('search.locationError'),
            variant: "destructive",
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast({
        title: t('search.error'),
        description: t('search.browserNotSupported'),
        variant: "destructive",
      });
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLocateMe}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
        </Button>
      </div>
      <MapView
        onMapClick={handleMapClick}
        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}

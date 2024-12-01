'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

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
        onLocationFound({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          name: location.display_name,
        });
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

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  return (
    <div className="flex gap-4 w-full max-w-2xl">
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={t('search.placeholder')}
        className="h-12"
        disabled={isSearching}
      />
      <Input
        type="number"
        value={radius}
        onChange={handleRadiusChange}
        placeholder="Search Radius"
        className="h-12"
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
  );
}

'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMonitoring } from '@/components/providers/monitoring-provider';

// Lazy load map components
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

// Cache for tile layer responses
const tileCache = new Map<string, Response>();

interface OptimizedMapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  onMapLoad?: () => void;
}

function MapFallback() {
  return (
    <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mb-2 animate-spin mx-auto text-blue-500" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  );
}

export default function OptimizedMap({ center, zoom, markers = [], onMapLoad }: OptimizedMapProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackEvent, startPerformanceMark, endPerformanceMark } = useMonitoring();

  // Only load map when in viewport
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Track map load performance
  useEffect(() => {
    if (inView) {
      startPerformanceMark('map_load');
    }
  }, [inView, startPerformanceMark]);

  // Handle map load completion
  const handleMapLoad = () => {
    setIsMapLoaded(true);
    endPerformanceMark('map_load');
    onMapLoad?.();

    trackEvent('map_loaded', {
      center,
      zoom,
      markerCount: markers.length,
    });
  };

  // Custom tile layer with caching
  const customTileLayer = {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    fetchTile: async (url: string) => {
      // Check cache first
      if (tileCache.has(url)) {
        return tileCache.get(url)!.clone();
      }

      try {
        const response = await fetch(url);
        // Cache the response
        tileCache.set(url, response.clone());
        return response;
      } catch (error) {
        console.error('Failed to fetch tile:', error);
        throw error;
      }
    },
  };

  // Clear tile cache when component unmounts
  useEffect(() => {
    return () => {
      tileCache.clear();
    };
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div ref={ref} className="relative h-[400px] rounded-lg overflow-hidden">
      {inView ? (
        <Suspense fallback={<MapFallback />}>
          <MapContainer
            center={center}
            zoom={zoom}
            className="h-full w-full"
            whenReady={handleMapLoad}
            preferCanvas={true} // Better performance for many markers
          >
            <TileLayer
              url={customTileLayer.url}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              // Custom getTileUrl function with caching
              getTileUrl={(coords) => {
                const url = customTileLayer.url
                  .replace('{s}', 'a')
                  .replace('{z}', coords.z.toString())
                  .replace('{x}', coords.x.toString())
                  .replace('{y}', coords.y.toString());
                
                // Trigger tile fetch with caching
                customTileLayer.fetchTile(url).catch(() => {
                  setError('Failed to load map tiles');
                });

                return url;
              }}
            />

            {/* Render markers only after map is loaded for better performance */}
            {isMapLoaded && markers.map((marker, index) => (
              <Marker
                key={`${marker.position.join(',')}-${index}`}
                position={marker.position}
              >
                {marker.popup && <Popup>{marker.popup}</Popup>}
              </Marker>
            ))}
          </MapContainer>
        </Suspense>
      ) : (
        <div className="h-full w-full bg-gray-100 rounded-lg" />
      )}
    </div>
  );
}

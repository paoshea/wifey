'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { usePerformance } from '@/lib/hooks/use-performance';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import dynamic from 'next/dynamic';

// Dynamically import map components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);

interface OptimizedMapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  onMapLoad?: () => void;
  className?: string;
}

// Tile layer cache
const tileCache = new Map<string, HTMLImageElement>();

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

export default function OptimizedMap({
  center,
  zoom,
  markers = [],
  onMapLoad,
  className = '',
}: OptimizedMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [visibleMarkers, setVisibleMarkers] = useState<typeof markers>([]);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const { trackEffect, trackEventHandler, getPerformanceReport } = usePerformance({
    componentName: 'OptimizedMap',
    thresholds: {
      renderTime: 50,
      effectTime: 200,
      eventTime: 100,
    },
  });

  // Memoize tile layer URL function
  const getTileUrl = useMemo(() => {
    return (coords: { x: number; y: number; z: number }): string => {
      const url = `https://{s}.tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`;
      
      // Prefetch and cache tiles
      if (!tileCache.has(url)) {
        const img = new Image();
        img.src = url;
        tileCache.set(url, img);
      }
      
      return url;
    };
  }, []);

  // Handle map load
  const handleMapLoad = trackEventHandler('map-load', (map: L.Map) => {
    performanceMonitor.startMark('map_load');
    mapRef.current = map;
    setIsMapLoaded(true);
    onMapLoad?.();
    performanceMonitor.endMark('map_load');
  });

  // Update visible markers based on viewport
  const updateVisibleMarkers = useCallback(() => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const visible = markers.filter(marker =>
      bounds.contains({ lat: marker.position[0], lng: marker.position[1] })
    );
    setVisibleMarkers(visible);
  }, [markers]);

  // Handle map movement
  const handleMapMove = trackEventHandler('map-move', () => {
    performanceMonitor.startMark('map_move');
    updateVisibleMarkers();
    performanceMonitor.endMark('map_move');
  });

  // Initialize map event listeners
  useEffect(
    trackEffect('map-events', () => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      map.on('moveend', handleMapMove);
      map.on('zoomend', handleMapMove);

      return () => {
        map.off('moveend', handleMapMove);
        map.off('zoomend', handleMapMove);
      };
    }),
    [handleMapMove]
  );

  // Clean up tile cache
  useEffect(
    trackEffect('tile-cache-cleanup', () => {
      return () => {
        tileCache.clear();
      };
    }),
    []
  );

  // Log performance metrics
  useEffect(
    trackEffect('performance-logging', () => {
      const interval = setInterval(() => {
        const report = getPerformanceReport();
        console.debug('Map Performance Report:', report);
      }, 60000); // Log every minute

      return () => clearInterval(interval);
    }),
    [getPerformanceReport]
  );

  if (!inView) {
    return <div ref={inViewRef} className={`h-[400px] ${className}`} />;
  }

  return (
    <div className={`relative h-[400px] ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        whenReady={handleMapLoad}
        className="h-full w-full"
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          getTileUrl={getTileUrl}
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {isMapLoaded && visibleMarkers.map((marker, index) => (
          <Marker
            key={`${marker.position.join(',')}-${index}`}
            position={marker.position}
          />
        ))}
      </MapContainer>

      {!isMapLoaded && <MapFallback />}

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={() => mapRef.current?.setView(center, zoom)}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Reset View"
        >
          <MapIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer as ReactTileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components with no SSR
const dynamic = require('next/dynamic');

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

  const { startMark, endMark } = performanceMonitor;

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
  const handleMapLoad = () => {
    startMark('map_load');
    setIsMapLoaded(true);
    onMapLoad?.();
    endMark('map_load');
  };

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
  const handleMapMove = () => {
    startMark('map_move');
    updateVisibleMarkers();
    endMark('map_move');
  };

  // Handle map zoom change
  const handleZoomChange = () => {
    startMark('map_zoom_change');
    updateVisibleMarkers();
    endMark('map_zoom_change');
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Initialize map features
    const map = mapRef.current;
    map.setView(center, zoom);
    
    // Add event listeners
    map.on('moveend', handleMapMove);
    map.on('zoomend', handleZoomChange);
    
    return () => {
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleZoomChange);
    };
  }, [center, zoom, handleMapMove, handleZoomChange]);

  // Clean up tile cache
  useEffect(() => {
    return () => {
      tileCache.clear();
    };
  }, []);

  // Log performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      console.debug('Map Performance Report:', report);
    }, 60000); // Log every minute

    return () => clearInterval(interval);
  }, []);

  if (!inView) {
    return <div ref={inViewRef} className={`h-[400px] ${className}`} />;
  }

  return (
    <div className={`relative h-[400px] ${className}`}>
      <MapContainer
        ref={mapRef}
        className="h-full w-full"
        center={center}
        zoom={zoom}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        whenReady={() => {
          if (mapRef.current) {
            handleMapLoad();
          }
        }}
      >
        <ReactTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{
            tileload: (e) => {
              const tile = e.tile as HTMLImageElement;
              const url = tile.src;
              if (!tileCache.has(url)) {
                tileCache.set(url, tile.cloneNode() as HTMLImageElement);
              }
            }
          }}
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

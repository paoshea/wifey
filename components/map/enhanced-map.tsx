'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import * as L from 'leaflet';
import { MapService } from '@/lib/services/map/map-service';
import { CarrierCoverage } from '@/lib/carriers/types';
import { CoverageSearchResult } from '@/lib/types';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Custom marker icon
const coverageIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Tile layer with caching
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

// Map bounds updater component
function BoundsUpdater({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      onBoundsChange(map.getBounds());
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);

  return null;
}

export interface EnhancedMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  onMapLoad?: () => void;
  className?: string;
  searchResult?: CoverageSearchResult | null;
}

export const EnhancedMap = ({
  initialCenter,
  initialZoom,
  onMapLoad,
  className = '',
  searchResult = null
}: EnhancedMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [coverage, setCoverage] = useState<CarrierCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Debounce bounds updates to prevent too many API calls
  const debouncedFetchCoverage = useDebounce(async (bounds: L.LatLngBounds) => {
    setIsLoading(true);
    try {
      const data = await MapService.getCoverageData({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
      setCoverage(data);
    } catch (error) {
      console.error('Error fetching coverage:', error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    debouncedFetchCoverage(bounds);
  }, [debouncedFetchCoverage]);

  // Update coverage when search result changes
  useEffect(() => {
    if (searchResult) {
      setCoverage(searchResult.coverage);
    }
  }, [searchResult]);

  // Track map load time
  useEffect(() => {
    if (isMapLoaded) {
      const loadTime = performance.now();
      performanceMonitor.trackMetric('map-load-time', loadTime, {
        initialCenter,
        initialZoom
      });
    }
  }, [isMapLoaded, initialCenter, initialZoom]);

  // Offline support initialization
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/map-worker.js').catch(console.error);
    }
  }, []);

  const mapContent = useMemo(() => (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className={`h-[400px] ${className}`}
      whenReady={() => {
        setIsMapLoaded(true);
        onMapLoad?.();
      }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BoundsUpdater onBoundsChange={handleBoundsChange} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover
      >
        {coverage.map((point) => (
          <Marker
            key={`${point.location.lat}-${point.location.lng}`}
            position={[point.location.lat, point.location.lng]}
            icon={coverageIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{point.provider}</h3>
                <p>Signal: {point.signalStrength}dBm</p>
                <p>Technology: {point.technology}</p>
                {point.reliability && (
                  <p>Reliability: {point.reliability.toFixed(1)}%</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
      {isLoading && (
        <div className="absolute top-2 right-2 z-[1000] bg-white rounded-md shadow-md p-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      )}
    </MapContainer>
  ), [initialCenter, initialZoom, className, onMapLoad, coverage, isLoading, handleBoundsChange]);

  if (!inView) {
    return <div ref={inViewRef}><MapFallback /></div>;
  }

  return <div ref={inViewRef}>{mapContent}</div>;
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Signal, Loader2, Map } from 'lucide-react';
import { CarrierCoverage } from '@/lib/carriers/types';
import { getSignalIcon, coverageToHeatmapData } from '@/lib/utils/map-utils';
import XMarksSpotButton from './x-marks-spot-button';
import SuccessPopup from './success-popup';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useSignalMonitor } from '@/hooks/useSignalMonitor';
import { measurementStore } from '@/lib/storage/measurement-store';
import { measurementSync } from '@/lib/sync/measurement-sync';
import { SignalInfoPanel } from './signal-info-panel';
import HeatmapLayer from './heatmap-layer';
import type { SignalMeasurement } from '@/lib/types/monitoring';

interface EnhancedCoverageMapProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  coveragePoints: CarrierCoverage[];
  isLoading: boolean;
  onAddCoveragePoint: (point: Omit<CarrierCoverage, 'id'>) => void;
  onUpdateCoveragePoint: (id: string, data: Partial<CarrierCoverage>) => void;
  isOffline: boolean;
}

// Custom marker for newly marked spots
const xMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="2"/>
      <path d="M10 10L22 22M22 10L10 22" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Animation component for newly marked spots
const MarkedSpotAnimation = ({ position }: { position: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    const circle = L.circle(position, {
      radius: 100,
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    const animate = () => {
      circle.setRadius(100);
      circle.setStyle({ fillOpacity: 0.2 });
      
      setTimeout(() => {
        circle.setRadius(50);
        circle.setStyle({ fillOpacity: 0 });
      }, 1000);
    };

    const interval = setInterval(animate, 2000);
    animate();

    return () => {
      clearInterval(interval);
      map.removeLayer(circle);
    };
  }, [map, position]);

  return null;
};

const selectedMarkerIcon = L.icon({
  iconUrl: '/icons/map-marker-selected.svg',
  iconRetinaUrl: '/icons/map-marker-selected.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const defaultMarkerIcon = L.icon({
  iconUrl: '/icons/map-marker.svg',
  iconRetinaUrl: '/icons/map-marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const EnhancedCoverageMap: React.FC<EnhancedCoverageMapProps> = ({
  onLocationSelect,
  coveragePoints,
  isLoading,
  onAddCoveragePoint,
  onUpdateCoveragePoint,
  isOffline,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [newlyMarkedSpot, setNewlyMarkedSpot] = useState<[number, number] | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [markedLocation, setMarkedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<SignalMeasurement | null>(null);
  const [syncStats, setSyncStats] = useState<{ pending: number; failed: number }>({ pending: 0, failed: 0 });
  
  // Default bounds for Costa Rica
  const bounds = {
    minLat: 8.0,
    maxLat: 11.2,
    minLng: -85.9,
    maxLng: -82.6
  };

  const { 
    isMonitoring, 
    measurements, 
    error: monitoringError,
    startMonitoring, 
    stopMonitoring 
  } = useSignalMonitor({
    onMeasurement: async (measurement) => {
      // Store measurement locally
      const id = await measurementStore.storeMeasurement(measurement);
      
      // Add to map
      onAddCoveragePoint({
        provider: measurement.provider,
        signalStrength: measurement.signalStrength,
        technology: measurement.technology,
        location: {
          lat: measurement.geolocation.lat,
          lng: measurement.geolocation.lng
        },
        reliability: 1,
      });
    },
    interval: 60000, // Check signal every minute
  });

  // Start sync when monitoring starts
  useEffect(() => {
    if (isMonitoring) {
      measurementSync.startAutoSync((stats) => {
        setSyncStats({
          pending: stats.pending,
          failed: stats.failed,
        });
      });
    } else {
      measurementSync.stopAutoSync();
    }

    return () => {
      measurementSync.stopAutoSync();
    };
  }, [isMonitoring]);

  const handleMarkSpot = useCallback(async (location: { lat: number; lng: number }) => {
    try {
      const newPoint: Omit<CarrierCoverage, 'id'> = {
        location,
        signalStrength: 0, // Will be updated with actual signal strength
        provider: selectedProvider || 'unknown',
        technology: '4G', // Default, can be updated later
        reliability: 1,
      };

      await onAddCoveragePoint(newPoint);
      setNewlyMarkedSpot([location.lat, location.lng]);
      setMarkedLocation(location);
      setShowSuccessPopup(true);

      // Clear the animation after 5 seconds
      setTimeout(() => setNewlyMarkedSpot(null), 5000);
    } catch (error) {
      console.error('Failed to mark spot:', error);
    }
  }, [selectedProvider, onAddCoveragePoint]);

  const handleCloseSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false);
    setMarkedLocation(null);
  }, []);

  const center: [number, number] = [
    (bounds.maxLat + bounds.minLat) / 2,
    (bounds.maxLng + bounds.minLng) / 2
  ];

  if (isLoading) {
    return (
      <Alert className="animate-pulse">
        <AlertDescription className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading coverage map...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative w-full h-full">
      {monitoringError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to monitor signal: {monitoringError.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          variant={isMonitoring ? "destructive" : "default"}
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className="w-full"
        >
          {isMonitoring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Stop Monitoring
            </>
          ) : (
            <>
              <Signal className="mr-2 h-4 w-4" />
              Start Monitoring
            </>
          )}
        </Button>

        {isMonitoring && (syncStats.pending > 0 || syncStats.failed > 0) && (
          <div className="text-sm text-gray-500 bg-white/90 rounded-md p-2">
            {syncStats.pending > 0 && (
              <div>Pending sync: {syncStats.pending}</div>
            )}
            {syncStats.failed > 0 && (
              <div className="text-red-500">Failed sync: {syncStats.failed}</div>
            )}
          </div>
        )}
        
        <XMarksSpotButton
          disabled={!selectedLocation}
          onMarkSpot={handleMarkSpot}
        />
      </div>

      {selectedMeasurement && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80">
          <SignalInfoPanel
            measurement={selectedMeasurement}
            className="bg-white/95 shadow-lg"
          />
        </div>
      )}

      <div className="h-[600px] relative rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={center}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {!showHeatmap && coveragePoints.map((point: CarrierCoverage, index: number) => (
            <Marker
              key={index}
              position={[point.location.lat, point.location.lng]}
              icon={selectedLocation && selectedLocation[0] === point.location.lat && selectedLocation[1] === point.location.lng ? selectedMarkerIcon : defaultMarkerIcon}
            >
              <Popup>
                <div className="p-2 space-y-2">
                  <h3 className="font-semibold text-blue-600">
                    {point.provider}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center">
                      <Signal className="w-4 h-4 mr-1" />
                      Signal: {point.signalStrength}%
                    </p>
                    <p>Technology: {point.technology}</p>
                    <p>Reliability: {point.reliability}%</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {showHeatmap && (
            <HeatmapLayer points={coverageToHeatmapData(coveragePoints)} />
          )}

          {newlyMarkedSpot && (
            <>
              <Marker
                position={newlyMarkedSpot}
                icon={xMarkerIcon}
              >
                <Popup>
                  <div className="p-2 text-center">
                    <h3 className="font-semibold text-red-600">X Marks the Spot!</h3>
                    <p className="text-sm text-gray-600">Coverage point marked</p>
                  </div>
                </Popup>
              </Marker>
              <MarkedSpotAnimation position={newlyMarkedSpot} />
            </>
          )}
        </MapContainer>

        {/* Floating X Marks Spot Button */}
        <div className="absolute bottom-6 right-6 z-[1000] space-y-2">
          <Alert>
            <AlertDescription>
              {isOffline 
                ? 'Working offline. Your marked spots will be synced when connection is restored.'
                : 'Click the X button to mark spots with coverage. Your contributions help others find better signal!'}
            </AlertDescription>
          </Alert>

          {/* Success Popup */}
          {markedLocation && (
            <SuccessPopup
              show={showSuccessPopup}
              onClose={handleCloseSuccessPopup}
              location={markedLocation}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoverageMap;

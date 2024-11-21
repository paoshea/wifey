'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Signal, Loader2 } from 'lucide-react';
import { CarrierCoverage } from '@/lib/carriers/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const coverageIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function CoverageAreaMap() {
  const [coverage, setCoverage] = useState<CarrierCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Default bounds for Costa Rica
  const bounds = {
    minLat: 8.0,
    maxLat: 11.2,
    minLng: -85.9,
    maxLng: -82.6
  };

  const fetchAreaCoverage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/coverage/cellular/area?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLng=${bounds.minLng}&maxLng=${bounds.maxLng}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch coverage data');
      }
      
      const coverageData: CarrierCoverage[] = await response.json();
      setCoverage(coverageData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreaCoverage();
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
    <div className="space-y-4">
      <div className="h-[500px] relative rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={center}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Rectangle
            bounds={[[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]]}
            pathOptions={{ color: 'blue', weight: 1, fillOpacity: 0.1 }}
          />
          
          {coverage.map((point, index) => (
            <Marker
              key={index}
              position={[point.location.lat, point.location.lng]}
              icon={coverageIcon}
            >
              <Popup>
                <div className="p-2 space-y-2">
                  <h3 className="font-semibold text-green-600">
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
        </MapContainer>
      </div>
    </div>
  );
}
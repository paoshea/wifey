'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation2, Loader2, Signal } from 'lucide-react';
import { CarrierCoverage } from '@/lib/carriers/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const coverageIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const deadZoneIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function CoverageRouteMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [coverage, setCoverage] = useState<CarrierCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const findNearestCoverage = async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/coverage/cellular/cr?lat=${userLocation[0]}&lng=${userLocation[1]}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch coverage data');
      }
      
      const coverageData: CarrierCoverage[] = await response.json();
      setCoverage(coverageData);
      
      // Find the strongest signal
      const bestCoverage = coverageData.reduce((best, current) => 
        current.signalStrength > best.signalStrength ? current : best
      );
      
      setRoute([
        userLocation,
        [userLocation[0] + 0.005, userLocation[1] + 0.005],
        [bestCoverage.location.lat, bestCoverage.location.lng]
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userLocation) {
    return (
      <Alert className="animate-pulse">
        <AlertDescription className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Getting your location...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[500px] relative rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={userLocation}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {userLocation && (
            <Marker position={userLocation} icon={deadZoneIcon}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-red-600">Dead Zone</h3>
                  <p className="text-sm text-gray-600">Your current location</p>
                </div>
              </Popup>
            </Marker>
          )}
          
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
          
          {route.length > 0 && (
            <Polyline 
              positions={route}
              pathOptions={{
                color: 'blue',
                weight: 4,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '1, 10'
              }}
              className="animate-pulse"
            />
          )}
        </MapContainer>
      </div>

      <Button 
        onClick={findNearestCoverage}
        className="w-full bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Finding Coverage...
          </>
        ) : (
          <>
            <Navigation2 className="w-4 h-4 mr-2" />
            Find Route to Coverage
          </>
        )}
      </Button>
    </div>
  );
}
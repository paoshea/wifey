'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const wifiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type WifiHotspot = {
  id: string;
  name: string;
  location: [number, number];
  provider: string;
  speed: string;
  distance: string;
};

export default function FreeWifiMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hotspots, setHotspots] = useState<WifiHotspot[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          fetchNearbyHotspots([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const fetchNearbyHotspots = async (location: [number, number]) => {
    // Simulated hotspots - in real app, this would come from MongoDB
    const simulatedHotspots: WifiHotspot[] = [
      {
        id: '1',
        name: 'Local Library',
        location: [location[0] + 0.002, location[1] + 0.002],
        provider: 'Public Library',
        speed: '50 Mbps',
        distance: '0.2 km'
      },
      {
        id: '2',
        name: 'Coffee Shop',
        location: [location[0] - 0.002, location[1] - 0.002],
        provider: 'Local Cafe',
        speed: '30 Mbps',
        distance: '0.3 km'
      },
      {
        id: '3',
        name: 'Community Center',
        location: [location[0] + 0.003, location[1] - 0.001],
        provider: 'City WiFi',
        speed: '40 Mbps',
        distance: '0.4 km'
      }
    ];
    
    setHotspots(simulatedHotspots);
  };

  if (!userLocation) {
    return (
      <Alert>
        <AlertDescription>
          Getting your location...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[500px] relative">
        <MapContainer
          center={userLocation}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {userLocation && (
            <Circle
              center={userLocation}
              radius={500}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />
          )}
          
          {hotspots.map((hotspot) => (
            <Marker
              key={hotspot.id}
              position={hotspot.location}
              icon={wifiIcon}
            >
              <Popup>
                <div className="space-y-2">
                  <h3 className="font-semibold">{hotspot.name}</h3>
                  <p className="text-sm">Provider: {hotspot.provider}</p>
                  <p className="text-sm">Speed: {hotspot.speed}</p>
                  <p className="text-sm">Distance: {hotspot.distance}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <Button 
        onClick={() => userLocation && fetchNearbyHotspots(userLocation)}
        className="w-full"
      >
        <Wifi className="w-4 h-4 mr-2" />
        Refresh Nearby Hotspots
      </Button>
    </div>
  );
}
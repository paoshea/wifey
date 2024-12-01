'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OnboardingMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

const customIcon = new Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapEventHandler({ onLocationSelect }: OnboardingMapProps) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  useEffect(() => {
    // Request user's location and center map
    map.locate();
  }, [map]);

  return null;
}

function MapCenterHandler() {
  const map = useMap();

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 16
    });
  }, [map]);

  return null;
}

export default function OnboardingMap({ onLocationSelect }: OnboardingMapProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler onLocationSelect={handleLocationSelect} />
      <MapCenterHandler />
      {selectedPosition && (
        <Marker position={selectedPosition} icon={customIcon} />
      )}
    </MapContainer>
  );
}

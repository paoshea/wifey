'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a custom icon using SVG
const icon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-primary">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
  </svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

interface OnboardingMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

function MapController() {
  const map = useMap();

  useEffect(() => {
    // Request user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);
      },
      () => {
        // Default to a central location if geolocation is denied
        map.setView([9.9281, -84.0907], 13); // Costa Rica center
      }
    );

    // Add zoom control to the map
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

  }, [map]);

  return null;
}

function MapEventHandler({ onLocationSelect, setPosition }: {
  onLocationSelect?: (lat: number, lng: number) => void;
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect?.(lat, lng);
    },
  });

  return null;
}

export default function OnboardingMap({ onLocationSelect }: OnboardingMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  return (
    <MapContainer
      style={{ height: '100%', width: '100%' }}
      center={[9.9281, -84.0907]} // Default to Costa Rica
      zoom={13}
      zoomControl={false} // We'll add zoom control in bottomright position
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController />
      <MapEventHandler onLocationSelect={onLocationSelect} setPosition={setPosition} />
      {position && (
        <Marker position={position} icon={icon} />
      )}
    </MapContainer>
  );
}

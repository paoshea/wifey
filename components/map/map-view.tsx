'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wifi, Signal } from 'lucide-react';

// Fix for Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

type MapPoint = {
  id: string;
  type: 'wifi' | 'coverage';
  name: string;
  coordinates: [number, number];
  details: {
    strength?: string;
    speed?: string;
    provider?: string;
    type?: 'free' | 'paid' | 'restricted';
  };
};

interface MapViewProps {
  points: MapPoint[];
  activeLayer: 'wifi' | 'coverage' | 'both';
  onPointSelect: (point: MapPoint) => void;
  center?: [number, number];
  zoom?: number;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function MapView({
  points,
  activeLayer,
  onPointSelect,
  center = [9.9281, -84.0907], // Default center (Costa Rica)
  zoom = 13
}: MapViewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  const filteredPoints = points.filter(point => {
    if (activeLayer === 'both') return true;
    return point.type === activeLayer;
  });

  const getMarkerIcon = (type: 'wifi' | 'coverage') => {
    const iconHtml = type === 'wifi' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-signal"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20v-12"/><path d="M22 20v-16"/></svg>';

    return L.divIcon({
      html: `<div style="color: ${type === 'wifi' ? '#3b82f6' : '#22c55e'}; background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${iconHtml}</div>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className="w-full h-full rounded-lg"
      style={{ background: '#f3f4f6' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRecenter center={mapCenter} />
      
      {filteredPoints.map((point) => (
        <Marker
          key={point.id}
          position={point.coordinates}
          icon={getMarkerIcon(point.type)}
          eventHandlers={{
            click: () => onPointSelect(point)
          }}
        >
          <Popup>
            <div className="p-2">
              <div className="flex items-center space-x-2">
                {point.type === 'wifi' ? (
                  <Wifi className="w-4 h-4 text-blue-500" />
                ) : (
                  <Signal className="w-4 h-4 text-green-500" />
                )}
                <h3 className="font-semibold">{point.name}</h3>
              </div>
              {point.details.speed && (
                <p className="text-sm text-gray-600">Speed: {point.details.speed}</p>
              )}
              {point.details.strength && (
                <p className="text-sm text-gray-600">Strength: {point.details.strength}</p>
              )}
              {point.details.provider && (
                <p className="text-sm text-gray-600">Provider: {point.details.provider}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

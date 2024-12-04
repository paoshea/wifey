'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wifi, Signal, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Fix for Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: '/icons/map-marker.svg',
  iconRetinaUrl: '/icons/map-marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

export type MapPoint = {
  id: string;
  type: 'wifi' | 'coverage';
  name: string;
  coordinates: [number, number];
  details: {
    strength?: string;
    speed?: string;
    provider?: string;
    type?: 'free' | 'paid' | 'restricted';
    timestamp?: string;
  };
};

interface MapViewProps {
  points?: MapPoint[];
  activeLayer?: 'wifi' | 'coverage' | 'both';
  onPointSelect?: (point: MapPoint) => void;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  autoLocate?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function MapMarkers({ points, onPointSelect }: { points: MapPoint[]; onPointSelect?: (point: MapPoint) => void }) {
  return (
    <>
      {points.map((point) => (
        <Marker
          key={point.id}
          position={point.coordinates}
          icon={defaultIcon}
          eventHandlers={{
            click: () => onPointSelect?.(point),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{point.name}</h3>
              {point.details.provider && (
                <p className="text-sm text-gray-600">Provider: {point.details.provider}</p>
              )}
              {point.details.speed && (
                <p className="text-sm text-gray-600">Speed: {point.details.speed}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function MapView({
  points = [],
  activeLayer = 'both',
  onPointSelect = () => { },
  onMapClick,
  center = [9.9281, -84.0907], // Default center (Costa Rica)
  zoom = 13,
  autoLocate = false,
  selectedLocation
}: MapViewProps) {
  const mapRef = useRef<L.Map>(null);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.latlng);
    }
  };

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('click', handleMapClick);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarkers points={points} onPointSelect={onPointSelect} />
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={defaultIcon}
          >
            <Popup>Selected Location</Popup>
          </Marker>
        )}
        {center && <MapRecenter center={center} />}
      </MapContainer>
    </div>
  );
}

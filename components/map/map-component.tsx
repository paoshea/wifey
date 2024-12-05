'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { MapViewProps, MapPoint } from './types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapMarkers({
    points,
    onPointSelect,
    icon
}: {
    points: MapPoint[];
    onPointSelect?: (point: MapPoint) => void;
    icon: L.Icon;
}) {
    return (
        <>
            {points.map((point) => (
                <Marker
                    key={point.id}
                    position={point.coordinates}
                    icon={icon}
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

function MapEvents({ onClick }: { onClick?: (latlng: { lat: number; lng: number }) => void }) {
    useMapEvents({
        click: (e) => {
            if (onClick) {
                onClick(e.latlng);
            }
        },
    });
    return null;
}

export default function MapComponent({
    points = [],
    activeLayer = 'both',
    onPointSelect = () => { },
    onMapClick,
    center = [9.9281, -84.0907], // Default center (Costa Rica)
    zoom = 13,
    autoLocate = false,
    selectedLocation
}: MapViewProps) {
    const [icon, setIcon] = useState<L.Icon | null>(null);

    useEffect(() => {
        // Initialize Leaflet icon
        const defaultIcon = L.icon({
            iconUrl: '/icons/map-marker.svg',
            iconRetinaUrl: '/icons/map-marker.svg',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        });
        setIcon(defaultIcon);
    }, []);

    if (!icon) return null;

    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border relative">
            <MapContainer
                center={center}
                zoom={zoom}
                className="w-full h-full"
            >
                <MapEvents onClick={onMapClick} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapMarkers points={points} onPointSelect={onPointSelect} icon={icon} />
                {selectedLocation && (
                    <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                        icon={icon}
                    >
                        <Popup>Selected Location</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

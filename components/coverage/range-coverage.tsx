"use client"

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Signal, MapPin, Crosshair } from 'lucide-react';
import type { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import type {
  MapContainerProps,
  TileLayerProps,
  MarkerProps,
  PopupProps,
  CircleProps
} from 'react-leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic<MapContainerProps>(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic<TileLayerProps>(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic<MarkerProps>(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic<PopupProps>(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic<CircleProps>(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

// Custom map control component
const LocationControl = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { useMap } = mod;
    return function LocationControlComponent() {
      const map = useMap();
      const { toast } = useToast();

      const getUserLocation = useCallback(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location: LatLngTuple = [position.coords.latitude, position.coords.longitude];
              map.setView(location, 16);
            },
            (error) => {
              console.error('Error getting location:', error);
              toast({
                title: "Location Error",
                description: "Unable to get your location. Please enable location services.",
                variant: "destructive",
              });
            }
          );
        }
      }, [map, toast]);

      return (
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <Button
              size="icon"
              variant="outline"
              className="bg-white hover:bg-gray-100 rounded-sm"
              onClick={getUserLocation}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    };
  }),
  { ssr: false }
);

// Map events handler component
const MapEvents = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { useMapEvents } = mod;
    return function MapEventsComponent({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
      useMapEvents({
        click: onClick,
      });
      return null;
    };
  }),
  { ssr: false }
);

interface CoveragePoint {
  location: {
    lat: number;
    lng: number;
  };
  provider: string;
  signalStrength: number;
  technology: string;
}

export default function RangeCoverage() {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [searchRadius, setSearchRadius] = useState(1); // in kilometers
  const [isLoading, setIsLoading] = useState(false);
  const [coveragePoints, setCoveragePoints] = useState<CoveragePoint[]>([]);
  const [mapKey, setMapKey] = useState(0);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [newPoint, setNewPoint] = useState<LatLngTuple | null>(null);
  const { toast } = useToast();

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LatLngTuple = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setMapKey(prev => prev + 1);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (isAddingPoint) {
      const { lat, lng } = e.latlng;
      setNewPoint([lat, lng]);
      setIsAddingPoint(false);

      // Here you would typically make an API call to save the coverage point
      toast({
        title: "Coverage Point Added",
        description: "Your coverage point has been recorded.",
      });
    }
  };

  const fetchCoverageInRange = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/coverage/compare?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=${searchRadius * 1000}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch coverage data');
      }

      const data = await response.json();
      setCoveragePoints(data.points);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coverage data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalColor = (strength: number): string => {
    if (strength >= 80) return '#22c55e'; // green-500
    if (strength >= 60) return '#84cc16'; // lime-500
    if (strength >= 40) return '#eab308'; // yellow-500
    if (strength >= 20) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  if (!userLocation) {
    return (
      <Alert>
        <AlertDescription className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Getting your location...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Coverage Range (km)</Label>
          <span className="text-sm text-gray-500">{searchRadius} km</span>
        </div>
        <Slider
          min={0.1}
          max={5}
          step={0.1}
          value={[searchRadius]}
          onValueChange={(value: number[]) => setSearchRadius(value[0])}
        />
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={fetchCoverageInRange}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Signal className="w-4 h-4 mr-2" />
                Search Coverage
              </>
            )}
          </Button>
          <Button
            variant={isAddingPoint ? "secondary" : "outline"}
            onClick={() => setIsAddingPoint(!isAddingPoint)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isAddingPoint ? "Click Map to Add Point" : "Add Coverage Point"}
          </Button>
        </div>
      </div>

      <div className="h-[500px] relative rounded-lg overflow-hidden shadow-lg">
        {typeof window !== 'undefined' && (
          <MapContainer
            key={mapKey}
            center={userLocation}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <MapEvents onClick={handleMapClick} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* User location marker */}
            <Marker position={userLocation}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">Your Location</h3>
                </div>
              </Popup>
            </Marker>

            {/* Search radius circle */}
            <Circle
              center={userLocation}
              radius={searchRadius * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1
              }}
            />

            {/* New coverage point */}
            {newPoint && (
              <Marker position={newPoint}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">New Coverage Point</h3>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Coverage points */}
            {coveragePoints.map((point, index) => (
              <Marker
                key={index}
                position={[point.location.lat, point.location.lng]}
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
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            <LocationControl />
          </MapContainer>
        )}
      </div>
    </div>
  );
}

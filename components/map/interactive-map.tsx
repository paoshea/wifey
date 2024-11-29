import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon, Stroke, Fill } from 'ol/style';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMapLayers } from '@/hooks/use-map-layers';
import { Button } from '@/components/ui/button';
import { MapControls } from './map-controls';
import { MapLegend } from './map-legend';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

interface CoveragePoint {
  id: string;
  lat: number;
  lon: number;
  type: 'wifi' | 'cellular';
  strength: number;
  provider?: string;
}

export function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const { location, error: locationError } = useGeolocation();
  const { layers, toggleLayer } = useMapLayers();
  const { toast } = useToast();
  const t = useTranslations('Map');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([-122.4194, 37.7749]), // Default to San Francisco
        zoom: 13,
      }),
    });

    setMap(initialMap);

    return () => initialMap.setTarget(undefined);
  }, []);

  // Handle real-time location updates
  useEffect(() => {
    if (!map || !location) return;

    const userPosition = fromLonLat([location.longitude, location.latitude]);
    
    // Update user marker
    const userSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Point(userPosition),
        }),
      ],
    });

    const userLayer = new VectorLayer({
      source: userSource,
      style: new Style({
        image: new Icon({
          src: '/icons/user-location.svg',
          scale: 0.8,
        }),
      }),
    });

    map.getLayers().forEach(layer => {
      if (layer.get('name') === 'userLocation') {
        map.removeLayer(layer);
      }
    });

    userLayer.set('name', 'userLocation');
    map.addLayer(userLayer);
    map.getView().animate({ center: userPosition, duration: 500 });
  }, [map, location]);

  // Handle coverage points visualization
  useEffect(() => {
    if (!map) return;

    const coverageSource = new VectorSource();
    const wifiSource = new VectorSource();
    const heatmapSource = new VectorSource();

    // Mock data - replace with real API calls
    const mockCoveragePoints: CoveragePoint[] = [
      { id: '1', lat: 37.7749, lon: -122.4194, type: 'cellular', strength: 0.8 },
      { id: '2', lat: 37.7748, lon: -122.4192, type: 'wifi', strength: 0.9 },
    ];

    mockCoveragePoints.forEach(point => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([point.lon, point.lat])),
        properties: point,
      });

      if (point.type === 'wifi') {
        wifiSource.addFeature(feature);
      } else {
        coverageSource.addFeature(feature);
      }

      heatmapSource.addFeature(feature);
    });

    // Coverage points layer
    const coverageLayer = new VectorLayer({
      source: coverageSource,
      style: new Style({
        image: new Icon({
          src: '/icons/coverage-point.svg',
          scale: 0.6,
        }),
      }),
    });

    // WiFi hotspots layer
    const wifiLayer = new VectorLayer({
      source: wifiSource,
      style: new Style({
        image: new Icon({
          src: '/icons/wifi-hotspot.svg',
          scale: 0.6,
        }),
      }),
    });

    // Heatmap layer
    const heatmapLayer = new HeatmapLayer({
      source: heatmapSource,
      blur: 15,
      radius: 10,
      weight: (feature) => {
        return feature.get('properties').strength;
      },
    });

    coverageLayer.set('name', 'coverage');
    wifiLayer.set('name', 'wifi');
    heatmapLayer.set('name', 'heatmap');

    map.addLayer(coverageLayer);
    map.addLayer(wifiLayer);
    map.addLayer(heatmapLayer);

    return () => {
      map.removeLayer(coverageLayer);
      map.removeLayer(wifiLayer);
      map.removeLayer(heatmapLayer);
    };
  }, [map]);

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      toast({
        title: t('locationError'),
        description: locationError.message,
        variant: 'destructive',
      });
    }
  }, [locationError, toast, t]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <div ref={mapRef} className="w-full h-full" />
      <MapControls
        onLayerToggle={toggleLayer}
        layers={layers}
        onCenterLocation={() => {
          if (location) {
            map?.getView().animate({
              center: fromLonLat([location.longitude, location.latitude]),
              duration: 500,
            });
          }
        }}
      />
      <MapLegend layers={layers} />
    </div>
  );
}

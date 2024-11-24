'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface HeatmapLayerProps {
  points: Array<[number, number, number]>;
  options?: L.HeatMapOptions;
}

export default function HeatmapLayer({ points, options = {} }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // Create heatmap layer
    const heatLayer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      ...options
    });

    // Add to map
    heatLayer.addTo(map);

    // Cleanup
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
}

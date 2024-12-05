import { useState, useCallback } from 'react';
import { type IconName } from 'components/ui/icon';

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  icon: IconName;
}

interface MapLayersHook {
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
}

export function useMapLayers(): MapLayersHook {
  const [layers, setLayers] = useState<MapLayer[]>([
    {
      id: 'coverage',
      name: 'Coverage Points',
      visible: true,
      icon: 'signal',
    },
    {
      id: 'wifi',
      name: 'WiFi Hotspots',
      visible: true,
      icon: 'wifi',
    },
    {
      id: 'heatmap',
      name: 'Signal Heatmap',
      visible: true,
      icon: 'layers',
    },
  ]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  }, []);

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible }
          : layer
      )
    );
  }, []);

  return {
    layers,
    toggleLayer,
    setLayerVisibility,
  };
}

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from 'components/ui/icon';
import { type MapLayer } from 'hooks/use-map-layers';

interface MapLegendProps {
  layers: MapLayer[];
}

export function MapLegend({ layers }: MapLegendProps) {
  const t = useTranslations('Map');

  const visibleLayers = layers.filter(layer => layer.visible);

  if (visibleLayers.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-semibold mb-2">{t('legend')}</h3>
      <div className="flex flex-col gap-2">
        {visibleLayers.map(layer => (
          <div key={layer.id} className="flex items-center gap-2">
            <Icon name={layer.icon} className="w-4 h-4" />
            <span className="text-sm">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

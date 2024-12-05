import React from 'react';
import { Button } from 'components/ui/button';
import { Toggle } from 'components/ui/toggle';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from 'components/ui/icon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'components/ui/tooltip';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  icon: IconName;  // Updated to use IconName type
}

interface MapControlsProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string) => void;
  onCenterLocation: () => void;
}

export function MapControls({
  layers,
  onLayerToggle,
  onCenterLocation,
}: MapControlsProps) {
  const t = useTranslations('Map');

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-lg shadow-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={onCenterLocation}
              className="w-10 h-10"
            >
              <Icon name="crosshair" className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('centerOnMe')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-px bg-border my-2" />

      {layers.map(layer => (
        <TooltipProvider key={layer.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={layer.visible}
                onPressedChange={() => onLayerToggle(layer.id)}
                className="w-10 h-10"
              >
                <Icon name={layer.icon} className="w-5 h-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{layer.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

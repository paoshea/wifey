'use client';

import { LucideProps } from 'lucide-react';
import {
    Crosshair,
    Map,
    Layers,
    Wifi,
    Signal,
    MapPin,
    Navigation,
    type LucideIcon
} from 'lucide-react';

export type IconName =
    | 'crosshair'
    | 'map'
    | 'layers'
    | 'wifi'
    | 'signal'
    | 'map-pin'
    | 'navigation';

const icons: Record<IconName, LucideIcon> = {
    crosshair: Crosshair,
    map: Map,
    layers: Layers,
    wifi: Wifi,
    signal: Signal,
    'map-pin': MapPin,
    navigation: Navigation
};

interface IconProps extends Omit<LucideProps, 'ref'> {
    name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
    const IconComponent = icons[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    return <IconComponent {...props} />;
}

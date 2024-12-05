'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapPoint } from './types';

const MapComponent = dynamic(() => import('./map-component'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border relative flex items-center justify-center bg-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

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

export function ClientWrapper(props: MapViewProps) {
    return (
        <Suspense
            fallback={
                <div className="w-full h-[400px] rounded-lg overflow-hidden border relative flex items-center justify-center bg-gray-100">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            }
        >
            <MapComponent {...props} />
        </Suspense>
    );
}

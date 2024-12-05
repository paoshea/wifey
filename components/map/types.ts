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

export interface MapViewProps {
    points?: MapPoint[];
    activeLayer?: 'wifi' | 'coverage' | 'both';
    onPointSelect?: (point: MapPoint) => void;
    onMapClick?: (latlng: { lat: number; lng: number }) => void;
    center?: [number, number];
    zoom?: number;
    autoLocate?: boolean;
    selectedLocation?: { lat: number; lng: number } | null;
}

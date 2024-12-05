import { ClientWrapper } from './client-wrapper';
import type { MapViewProps } from './types';

export default function MapView(props: MapViewProps) {
  return <ClientWrapper {...props} />;
}

export type { MapPoint } from './types';

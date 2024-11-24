import React from 'react';
import { SignalMeasurement } from '@/lib/monitoring/signal-monitor';
import { Card } from '@/components/ui/card';
import {
  Signal,
  Wifi,
  Globe,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalInfoPanelProps {
  measurement: SignalMeasurement & {
    syncStatus?: 'pending' | 'syncing' | 'synced' | 'error';
  };
  className?: string;
}

export function SignalInfoPanel({ measurement, className }: SignalInfoPanelProps) {
  const getSignalQuality = (strength: number): string => {
    if (strength >= 4) return 'Excellent';
    if (strength >= 3) return 'Good';
    if (strength >= 2) return 'Fair';
    if (strength >= 1) return 'Poor';
    return 'No Signal';
  };

  const getSignalIcon = (strength: number) => {
    const commonClasses = 'w-4 h-4';
    const bars = [
      strength >= 1,
      strength >= 2,
      strength >= 3,
      strength >= 4,
    ];

    return (
      <div className="flex gap-0.5 items-end h-4">
        {bars.map((active, i) => (
          <div
            key={i}
            className={cn(
              'w-1 bg-current transition-all',
              active ? 'opacity-100' : 'opacity-30',
              {
                'h-1': i === 0,
                'h-2': i === 1,
                'h-3': i === 2,
                'h-4': i === 3,
              }
            )}
          />
        ))}
      </div>
    );
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className={cn('p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Signal className="w-5 h-5" />
          Signal Information
        </h3>
        {getSyncStatusIcon(measurement.syncStatus)}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Signal className="w-4 h-4" />
            Signal Strength
          </div>
          <div className="flex items-center gap-2">
            {getSignalIcon(measurement.signalStrength)}
            <span className="text-sm font-medium">
              {getSignalQuality(measurement.signalStrength)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wifi className="w-4 h-4" />
            Technology
          </div>
          <span className="text-sm font-medium">{measurement.technology}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            Provider
          </div>
          <span className="text-sm font-medium">{measurement.provider}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Last Updated
          </div>
          <span className="text-sm font-medium">
            {new Date(measurement.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {measurement.geolocation && (
        <div className="pt-2 border-t">
          <div className="text-sm text-gray-500 mb-1">Location</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm">
              Lat: {measurement.geolocation.lat.toFixed(6)}
            </div>
            <div className="text-sm">
              Lng: {measurement.geolocation.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

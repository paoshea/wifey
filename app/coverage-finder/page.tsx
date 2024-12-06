'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Signal, Map as MapIcon, History, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCoverageStore } from '@/lib/store/coverage-store';
import { useCoverageData } from '@/lib/hooks/use-coverage-data';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

// Dynamically import components that use window/navigator
const EnhancedCoverageMap = dynamic(
  () => import('@/components/coverage/enhanced-coverage-map'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const CoverageComparison = dynamic(
  () => import('@/components/coverage/coverage-comparison'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const CoverageMonitor = dynamic(
  () => import('@/components/coverage/coverage-monitor'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const CoverageNotifications = dynamic(
  () => import('@/components/coverage/coverage-notifications'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export default function CoverageFinder() {
  const { selectedLocation, setSelectedLocation } = useCoverageStore();
  const [activeTab, setActiveTab] = useState<'map' | 'comparison'>('map');
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Default bounds for Costa Rica
  const bounds = {
    minLat: 8.0,
    maxLat: 11.2,
    minLng: -85.9,
    maxLng: -82.6
  };

  const {
    coveragePoints,
    isLoading,
    error,
    addCoveragePoint,
    updateCoveragePoint: updatePoint,
    syncPendingUpdates,
    isOffline
  } = useCoverageData(bounds);

  // Wrapper function to match the expected signature
  const handleUpdateCoveragePoint = (id: string, data: Partial<any>) => {
    updatePoint({ id, data });
  };

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if geolocation is available and permitted
  useEffect(() => {
    if (!isMounted) return;

    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setIsLocationEnabled(result.state === 'granted');

        result.addEventListener('change', () => {
          setIsLocationEnabled(result.state === 'granted');
        });
      });
    }
  }, [isMounted]);

  // Sync pending updates when coming back online
  useEffect(() => {
    if (!isMounted) return;

    const handleOnline = () => {
      syncPendingUpdates();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingUpdates, isMounted]);

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setActiveTab('comparison');
  };

  // Don't render anything until mounted
  if (!isMounted) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load coverage data. {isOffline ? 'Working in offline mode.' : 'Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Location Permission Alert */}
      {!isLocationEnabled && (
        <Alert className="mb-4">
          <AlertDescription>
            Enable location services to receive coverage notifications when you enter areas with known coverage data.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">Coverage Finder</h1>
        <p className="text-gray-600">
          Find, compare, and analyze cellular coverage across Costa Rica with our interactive tools.
          {isOffline && ' (Working Offline)'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="h-5 w-5" />
              Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              View real-time coverage data with signal strength indicators and provider comparisons.
              Receive notifications about historical coverage in your area.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Access coverage history, view trends over time, and get notified when you enter
              areas with previously recorded coverage data.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Coverage Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Use our advanced algorithms to predict coverage in areas without direct measurements,
              based on nearby signal data and terrain analysis.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'map' ? 'default' : 'outline'}
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-2"
        >
          <MapIcon className="h-4 w-4" />
          Coverage Map
        </Button>
        <Button
          variant={activeTab === 'comparison' ? 'default' : 'outline'}
          onClick={() => setActiveTab('comparison')}
          className="flex items-center gap-2"
          disabled={!selectedLocation}
        >
          <Signal className="h-4 w-4" />
          Provider Comparison
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'map' ? 'Interactive Coverage Map' : 'Provider Comparison'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'map'
              ? 'Click on any location to view detailed coverage information and provider comparison.'
              : 'Compare coverage quality and reliability between different providers in the selected area.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'map' ? (
            <EnhancedCoverageMap
              onLocationSelect={handleLocationSelect}
              coveragePoints={coveragePoints ?? []}
              isLoading={isLoading}
              onAddCoveragePoint={addCoveragePoint}
              onUpdateCoveragePoint={handleUpdateCoveragePoint}
              isOffline={isOffline}
            />
          ) : (
            selectedLocation && <CoverageComparison location={selectedLocation} />
          )}
        </CardContent>
      </Card>

      {/* Coverage monitoring and notifications */}
      {isLocationEnabled && <CoverageMonitor />}
      <CoverageNotifications />
    </div>
  );
}

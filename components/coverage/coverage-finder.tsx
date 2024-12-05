import { useState, useEffect } from 'react';
import {
  OfflineManager,
  NavigationUpdate,
  CoveragePoint,
  LocationError,
  LocationErrorCode
} from '@/lib/offline';
import { useOfflineError } from '@/components/offline/error-handler';

interface CoverageFinderProps {
  className?: string;
}

export function CoverageFinder({ className = '' }: CoverageFinderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [navigationInfo, setNavigationInfo] = useState<NavigationUpdate | null>(null);
  const [nearestPoint, setNearestPoint] = useState<CoveragePoint | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const { handleError } = useOfflineError();

  useEffect(() => {
    const manager = OfflineManager.getInstance();

    // Listen for navigation updates
    const navigationCleanup = manager.onNavigationUpdate((update) => {
      setNavigationInfo(update);
    });

    return () => {
      navigationCleanup();
      // Stop navigation and measurement when component unmounts
      manager.stopAll();
    };
  }, []);

  const handleFindCoverage = async () => {
    const manager = OfflineManager.getInstance();
    setIsSearching(true);

    try {
      await manager.findAndNavigateToCoverage();
      setNearestPoint(manager.getCurrentTarget());
    } catch (error) {
      if (error instanceof LocationError) {
        handleError(error);
      } else {
        handleError(new LocationError(
          'Failed to find coverage',
          LocationErrorCode.UNKNOWN,
          error instanceof Error ? error : undefined
        ));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartMeasuring = async () => {
    const manager = OfflineManager.getInstance();

    try {
      await manager.startCoverageMeasurement();
      setIsMeasuring(true);
    } catch (error) {
      if (error instanceof LocationError) {
        handleError(error);
      } else {
        handleError(new LocationError(
          'Failed to start measurement',
          LocationErrorCode.UNKNOWN,
          error instanceof Error ? error : undefined
        ));
      }
    }
  };

  const handleStopMeasuring = async () => {
    const manager = OfflineManager.getInstance();

    try {
      const report = await manager.stopAndReportCoverage("Manual coverage report");
      setIsMeasuring(false);
      // Show success message or update UI with report details
    } catch (error) {
      if (error instanceof LocationError) {
        handleError(error);
      } else {
        handleError(new LocationError(
          'Failed to save measurement',
          LocationErrorCode.UNKNOWN,
          error instanceof Error ? error : undefined
        ));
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Section */}
      <div className="rounded-lg bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Find Coverage</h2>
        <div className="space-y-4">
          <button
            onClick={handleFindCoverage}
            disabled={isSearching}
            className="w-full btn btn-primary"
          >
            {isSearching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              'Find Nearest Coverage'
            )}
          </button>
        </div>
      </div>

      {/* Navigation Info */}
      {navigationInfo && (
        <div className="rounded-lg bg-card p-6">
          <h3 className="text-lg font-semibold mb-3">Navigation</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-medium">
                {navigationInfo.distance > 1000
                  ? `${(navigationInfo.distance / 1000).toFixed(1)} km`
                  : `${Math.round(navigationInfo.distance)} m`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Time:</span>
              <span className="font-medium">
                {navigationInfo.estimatedTime > 60
                  ? `${Math.round(navigationInfo.estimatedTime / 60)} min`
                  : `${navigationInfo.estimatedTime} sec`}
              </span>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              {navigationInfo.nextInstruction}
            </div>
          </div>
        </div>
      )}

      {/* Coverage Point Info */}
      {nearestPoint && (
        <div className="rounded-lg bg-card p-6">
          <h3 className="text-lg font-semibold mb-3">Coverage Point</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Signal Strength:</span>
              <span className="font-medium">{nearestPoint.averageStrength} dBm</span>
            </div>
            <div className="flex justify-between">
              <span>Reliability:</span>
              <span className="font-medium">{Math.round(nearestPoint.reliability * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span className="font-medium">
                {new Date(nearestPoint.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Controls */}
      <div className="rounded-lg bg-card p-6">
        <h3 className="text-lg font-semibold mb-3">Coverage Measurement</h3>
        <div className="space-y-4">
          {!isMeasuring ? (
            <button
              onClick={handleStartMeasuring}
              className="w-full btn btn-secondary"
            >
              Start Measuring
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span>Recording Coverage...</span>
              </div>
              <button
                onClick={handleStopMeasuring}
                className="w-full btn btn-secondary"
              >
                Stop & Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

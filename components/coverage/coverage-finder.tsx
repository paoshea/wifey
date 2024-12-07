'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  OfflineManager,
  NavigationUpdate,
  CoveragePoint,
  LocationError,
  LocationErrorCode
} from 'lib/offline';
import { useOfflineError } from 'components/offline/error-handler';
import {
  coverageFormSchema,
  type CoverageFormData
} from 'lib/schemas/coverage';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/ui/form';
import { Textarea } from 'components/ui/textarea';

interface CoverageFinderProps {
  className?: string;
}

export function CoverageFinder({ className = '' }: CoverageFinderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [navigationInfo, setNavigationInfo] = useState<NavigationUpdate | null>(null);
  const [nearestPoint, setNearestPoint] = useState<CoveragePoint | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const { handleError } = useOfflineError();

  const form = useForm<CoverageFormData>({
    resolver: zodResolver(coverageFormSchema),
    defaultValues: {
      networkType: 'cellular',
      quality: 'good'
    }
  });

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

  const onSubmit = async (data: CoverageFormData) => {
    const manager = OfflineManager.getInstance();

    try {
      const report = await manager.stopAndReportCoverage(data.notes);
      setIsMeasuring(false);
      form.reset();
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
          <Button
            onClick={handleFindCoverage}
            disabled={isSearching}
            className="w-full"
            variant="default"
          >
            {isSearching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </span>
            ) : (
              'Find Nearest Coverage'
            )}
          </Button>
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
        {!isMeasuring ? (
          <Button
            onClick={handleStartMeasuring}
            className="w-full"
            variant="secondary"
          >
            Start Measuring
          </Button>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="networkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select network type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cellular">Cellular</SelectItem>
                        <SelectItem value="wifi">WiFi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter carrier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signal Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select signal quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <Button type="submit" className="flex-1">
                  Save Measurement
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const manager = OfflineManager.getInstance();
                    manager.stopAll();
                    setIsMeasuring(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

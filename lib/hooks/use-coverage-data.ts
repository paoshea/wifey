import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCoverageStore } from '@/lib/store/coverage-store';
import { CarrierCoverage } from '@/lib/carriers/types';
import { SignalMeasurement } from '@/lib/types/monitoring';

const COVERAGE_KEYS = {
  all: ['coverage'] as const,
  area: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) =>
    [...COVERAGE_KEYS.all, 'area', bounds] as const,
  provider: (provider: string) => [...COVERAGE_KEYS.all, 'provider', provider] as const,
  point: (id: string) => [...COVERAGE_KEYS.all, 'point', id] as const,
};

// Convert CarrierCoverage to SignalMeasurement
// Convert CarrierCoverage to SignalMeasurement
const mapCarrierToSignal = (coverage: CarrierCoverage & { device?: { type: string; model: string; os: string } }, id?: string): SignalMeasurement => ({
  id,
  timestamp: Date.now(),
  carrier: coverage.provider || 'Unknown',
  network: coverage.technology || '4G',
  networkType: coverage.technology || '4G',
  device: coverage.device || {
    type: 'unknown',
    model: 'unknown',
    os: 'unknown'
  },
  signalStrength: coverage.signalStrength,
  technology: coverage.technology || '4G',
  provider: coverage.provider || 'Unknown',
  geolocation: coverage.location || {
    lat: 0,
    lng: 0
  }
});

export function useCoverageData(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}) {
  const queryClient = useQueryClient();
  const { isOffline, addCoveragePoint, updateCoveragePoint, syncPendingUpdates } = useCoverageStore();

  // Query for coverage data
  const {
    data: coveragePoints,
    isLoading,
    error,
  } = useQuery({
    queryKey: COVERAGE_KEYS.area(bounds),
    queryFn: async () => {
      const params = new URLSearchParams({
        minLat: bounds.minLat.toString(),
        maxLat: bounds.maxLat.toString(),
        minLng: bounds.minLng.toString(),
        maxLng: bounds.maxLng.toString(),
      });

      const response = await fetch(`/api/coverage/cellular/area?${params}`);
      if (!response.ok) throw new Error('Failed to fetch coverage data');
      return response.json() as Promise<CarrierCoverage[]>;
    },
    enabled: !isOffline,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for adding new coverage points
  const addMutation = useMutation({
    mutationFn: async (newPoint: Omit<CarrierCoverage, 'id'>) => {
      const response = await fetch('/api/coverage/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoint),
      });
      if (!response.ok) throw new Error('Failed to add coverage point');
      return response.json();
    },
    onMutate: async (newPoint) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: COVERAGE_KEYS.all });

      // Optimistically add the new point
      const optimisticPoint = {
        ...newPoint,
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      const signalMeasurement = mapCarrierToSignal(optimisticPoint as unknown as CarrierCoverage, optimisticPoint.id);
      addCoveragePoint(signalMeasurement);

      return { optimisticPoint: signalMeasurement };
    },
    onSuccess: (response, variables, context) => {
      // Update with the real data
      queryClient.setQueryData(
        COVERAGE_KEYS.area(bounds),
        (old: SignalMeasurement[] | undefined) =>
          old?.map((point) =>
            point.id === context?.optimisticPoint.id ? mapCarrierToSignal(response, point.id) : point
          )
      );
    },
    onError: (error, variables, context) => {
      console.error('Failed to add coverage point:', error);
      // If offline, keep optimistic update
      if (!isOffline) {
        queryClient.setQueryData(
          COVERAGE_KEYS.area(bounds),
          (old: SignalMeasurement[] | undefined) =>
            old?.filter((point) => point.id !== context?.optimisticPoint.id)
        );
      }
    },
  });

  // Mutation for updating coverage points
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CarrierCoverage>;
    }) => {
      const response = await fetch(`/api/coverage/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update coverage point');
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: COVERAGE_KEYS.point(id) });

      // Optimistically update
      updateCoveragePoint(id, data);

      return { previousPoint: queryClient.getQueryData(COVERAGE_KEYS.point(id)) };
    },
    onError: (error, variables, context) => {
      console.error('Failed to update coverage point:', error);
      // If offline, keep optimistic update
      if (!isOffline && context?.previousPoint) {
        queryClient.setQueryData(COVERAGE_KEYS.point(variables.id), context.previousPoint);
      }
    },
  });

  return {
    coveragePoints,
    isLoading,
    error,
    addCoveragePoint: addMutation.mutate,
    updateCoveragePoint: updateMutation.mutate,
    syncPendingUpdates,
    isOffline,
  };
}

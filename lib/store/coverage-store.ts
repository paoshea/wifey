import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { get, set } from 'idb-keyval';
import { CarrierCoverage } from '@/lib/carriers/types';

interface CoverageState {
  coveragePoints: CarrierCoverage[];
  pendingUpdates: Array<{
    type: 'add' | 'update';
    data: Partial<CarrierCoverage>;
    timestamp: number;
  }>;
  selectedLocation: { lat: number; lng: number } | null;
  selectedProvider: string | null;
  lastFetched: Record<string, number>;
  isOffline: boolean;
}

interface CoverageActions {
  setCoveragePoints: (points: CarrierCoverage[]) => void;
  addCoveragePoint: (point: CarrierCoverage) => void;
  updateCoveragePoint: (pointId: string, data: Partial<CarrierCoverage>) => void;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
  setSelectedProvider: (provider: string | null) => void;
  setIsOffline: (offline: boolean) => void;
  syncPendingUpdates: () => Promise<void>;
}

// Custom storage for handling large datasets
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value ? JSON.stringify(value) : null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      await set(name, parsed);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await set(name, undefined);
    } catch {}
  },
};

// Helper function to check if data is stale (older than 1 hour)
const isStale = (timestamp: number) => {
  return Date.now() - timestamp > 60 * 60 * 1000;
};

export const useCoverageStore = create<CoverageState & CoverageActions>()(
  persist(
    immer((set, get) => ({
      coveragePoints: [],
      pendingUpdates: [],
      selectedLocation: null,
      selectedProvider: null,
      lastFetched: {},
      isOffline: false,

      setCoveragePoints: (points) =>
        set((state) => {
          state.coveragePoints = points;
          state.lastFetched[`coverage-${state.selectedProvider || 'all'}`] = Date.now();
        }),

      addCoveragePoint: (point) =>
        set((state) => {
          state.coveragePoints.push(point);
          // Add to pending updates if offline
          if (state.isOffline) {
            state.pendingUpdates.push({
              type: 'add',
              data: point,
              timestamp: Date.now(),
            });
          }
        }),

      updateCoveragePoint: (pointId, data) =>
        set((state) => {
          const pointIndex = state.coveragePoints.findIndex((p) => p.id === pointId);
          if (pointIndex !== -1) {
            state.coveragePoints[pointIndex] = {
              ...state.coveragePoints[pointIndex],
              ...data,
            };

            // Add to pending updates if offline
            if (state.isOffline) {
              state.pendingUpdates.push({
                type: 'update',
                data: { id: pointId, ...data },
                timestamp: Date.now(),
              });
            }
          }
        }),

      setSelectedLocation: (location) =>
        set((state) => {
          state.selectedLocation = location;
        }),

      setSelectedProvider: (provider) =>
        set((state) => {
          state.selectedProvider = provider;
        }),

      setIsOffline: (offline) =>
        set((state) => {
          state.isOffline = offline;
        }),

      syncPendingUpdates: async () => {
        const state = get();
        const updates = [...state.pendingUpdates];

        if (updates.length === 0) return;

        try {
          for (const update of updates) {
            if (update.type === 'add') {
              await fetch('/api/coverage/contribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update.data),
              });
            } else {
              await fetch(`/api/coverage/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update.data),
              });
            }
          }

          // Clear synced updates
          set((state) => {
            state.pendingUpdates = state.pendingUpdates.filter(
              (update) => !updates.includes(update)
            );
          });
        } catch (error) {
          console.error('Failed to sync updates:', error);
        }
      },
    })),
    {
      name: 'coverage-store',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        coveragePoints: state.coveragePoints,
        pendingUpdates: state.pendingUpdates,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

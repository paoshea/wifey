import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { get, set } from 'idb-keyval';
import type { SignalMeasurement } from '@/lib/types/monitoring';

interface CoverageState {
  coveragePoints: SignalMeasurement[];
  pendingUpdates: { type: 'add' | 'update'; data: Partial<SignalMeasurement>; timestamp: number }[];
  selectedLocation: { lat: number; lng: number } | null;
  selectedProvider: string | null;
  lastFetched: Record<string, number>;
  isOffline: boolean;
}

interface CoverageActions {
  setCoveragePoints: (points: SignalMeasurement[]) => void;
  addCoveragePoint: (point: SignalMeasurement) => void;
  updateCoveragePoint: (pointId: string, data: Partial<SignalMeasurement>) => void;
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
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      await set(name, parsed);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await set(name, undefined);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Helper function to check if data is stale (older than 1 hour)
const isStale = (timestamp: number) => {
  return Date.now() - timestamp > 60 * 60 * 1000;
};

export const useCoverageStore = create<CoverageState & CoverageActions>()(
  persist(
    (set, get) => ({
      coveragePoints: [],
      pendingUpdates: [],
      selectedLocation: null,
      selectedProvider: null,
      lastFetched: {},
      isOffline: false,

      setCoveragePoints: (points) =>
        set(
          produce((state: CoverageState) => {
            state.coveragePoints = points;
            state.lastFetched[`coverage-${state.selectedProvider || 'all'}`] = Date.now();
          })
        ),

      addCoveragePoint: (point) =>
        set(
          produce((state: CoverageState) => {
            state.coveragePoints.push(point);
            if (state.isOffline) {
              state.pendingUpdates.push({
                type: 'add',
                data: point,
                timestamp: Date.now(),
              });
            }
          })
        ),

      updateCoveragePoint: (pointId: string, data: Partial<SignalMeasurement>) =>
        set(
          produce((state: CoverageState) => {
            const point = state.coveragePoints.find((p: SignalMeasurement) => p.id && p.id === pointId);
            if (point) {
              Object.assign(point, data);
              if (state.isOffline) {
                state.pendingUpdates.push({
                  type: 'update',
                  data: { id: pointId, ...data },
                  timestamp: Date.now(),
                });
              }
            }
          })
        ),

      setSelectedLocation: (location) =>
        set(
          produce((state: CoverageState) => {
            state.selectedLocation = location;
          })
        ),

      setSelectedProvider: (provider) =>
        set(
          produce((state: CoverageState) => {
            state.selectedProvider = provider;
          })
        ),

      setIsOffline: (offline) =>
        set(
          produce((state: CoverageState) => {
            state.isOffline = offline;
          })
        ),

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
          set(
            produce((state: CoverageState) => {
              state.pendingUpdates = state.pendingUpdates.filter(
                (update) => !updates.includes(update)
              );
            })
          );
        } catch (error) {
          console.error('Failed to sync updates:', error);
        }
      },
    }),
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

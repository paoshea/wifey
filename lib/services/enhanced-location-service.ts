import { CarrierCoverage } from '@/lib/carriers/types';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface MarkedLocation {
    id: string; // 8-digit ID
    coordinates: Coordinates;
    timestamp: string;
    coverage?: CarrierCoverage;
    markedBy?: string; // User ID
}

export interface DistanceResult {
    meters: number;
    kilometers: number;
    coordinates: Coordinates;
    coverage?: CarrierCoverage;
}

export class EnhancedLocationService {
    private static instance: EnhancedLocationService;
    private nextId: number = 10000000; // Start from the first 8-digit number
    private locations: Map<string, MarkedLocation> = new Map();

    private constructor() {}

    static getInstance(): EnhancedLocationService {
        if (!EnhancedLocationService.instance) {
            EnhancedLocationService.instance = new EnhancedLocationService();
        }
        return EnhancedLocationService.instance;
    }

    // Generate a unique 8-digit ID
    private generateId(): string {
        const id = this.nextId.toString();
        this.nextId++;
        return id;
    }

    // Mark a new coverage spot
    markLocation(
        coordinates: Coordinates,
        coverage?: CarrierCoverage,
        userId?: string
    ): string {
        const id = this.generateId();
        const location: MarkedLocation = {
            id,
            coordinates,
            timestamp: new Date().toISOString(),
            coverage,
            markedBy: userId
        };

        this.locations.set(id, location);
        this.persistToLocalStorage();
        return id;
    }

    // Get a location by its 8-digit ID
    getLocation(id: string): MarkedLocation | null {
        return this.locations.get(id) || null;
    }

    // Calculate distance between two points
    calculateDistance(from: Coordinates, to: Coordinates): DistanceResult {
        const R = 6371000; // Earth's radius in meters
        const φ1 = this.toRadians(from.latitude);
        const φ2 = this.toRadians(to.latitude);
        const Δφ = this.toRadians(to.latitude - from.latitude);
        const Δλ = this.toRadians(to.longitude - from.longitude);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInMeters = R * c;

        const location = Array.from(this.locations.values())
            .find(loc => loc.coordinates.latitude === to.latitude && 
                        loc.coordinates.longitude === to.longitude);

        return {
            meters: Math.round(distanceInMeters),
            kilometers: Math.round(distanceInMeters / 1000 * 100) / 100,
            coordinates: to,
            coverage: location?.coverage
        };
    }

    // Find nearest marked locations within radius
    findNearbyLocations(coordinates: Coordinates, radiusKm: number = 5): MarkedLocation[] {
        return Array.from(this.locations.values())
            .filter(location => {
                const distance = this.calculateDistance(coordinates, location.coordinates);
                return distance.kilometers <= radiusKm;
            })
            .sort((a, b) => {
                const distanceA = this.calculateDistance(coordinates, a.coordinates);
                const distanceB = this.calculateDistance(coordinates, b.coordinates);
                return distanceA.meters - distanceB.meters;
            });
    }

    // Convert degrees to radians
    private toRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    // Persist locations to localStorage
    private persistToLocalStorage(): void {
        if (typeof window !== 'undefined') {
            const data = Array.from(this.locations.entries());
            localStorage.setItem('marked-locations', JSON.stringify(data));
        }
    }

    // Load locations from localStorage
    loadFromLocalStorage(): void {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('marked-locations');
            if (data) {
                const entries = JSON.parse(data) as [string, MarkedLocation][];
                this.locations = new Map(entries);
                
                // Update nextId based on highest existing ID
                const maxId = Math.max(...Array.from(this.locations.keys()).map(Number));
                this.nextId = Math.max(this.nextId, maxId + 1);
            }
        }
    }

    // Export locations data
    exportLocations(): MarkedLocation[] {
        return Array.from(this.locations.values());
    }

    // Import locations data
    importLocations(locations: MarkedLocation[]): void {
        locations.forEach(location => {
            this.locations.set(location.id, location);
        });
        this.persistToLocalStorage();
    }

    // Clear all locations
    clearLocations(): void {
        this.locations.clear();
        this.persistToLocalStorage();
    }
}

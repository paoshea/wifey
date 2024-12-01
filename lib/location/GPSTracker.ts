export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
}

export interface LocationError {
    code: number;
    message: string;
    timestamp: number;
}

export class GPSTracker {
    private watchId: number | null = null;
    private lastPosition: Coordinates | null = null;
    private readonly errorLog: LocationError[] = [];

    constructor(private options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }) {}

    async getCurrentPosition(): Promise<Coordinates> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords: Coordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    this.lastPosition = coords;
                    resolve(coords);
                },
                (error) => {
                    const locationError: LocationError = {
                        code: error.code,
                        message: this.getErrorMessage(error),
                        timestamp: Date.now()
                    };
                    this.errorLog.push(locationError);
                    reject(locationError);
                },
                this.options
            );
        });
    }

    watchPosition(callback: (position: Coordinates) => void, onError?: (error: LocationError) => void): void {
        if (!navigator.geolocation) {
            const error: LocationError = {
                code: 0,
                message: 'Geolocation is not supported by this browser',
                timestamp: Date.now()
            };
            this.errorLog.push(error);
            if (onError) onError(error);
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coords: Coordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                this.lastPosition = coords;
                callback(coords);
            },
            (error) => {
                const locationError: LocationError = {
                    code: error.code,
                    message: this.getErrorMessage(error),
                    timestamp: Date.now()
                };
                this.errorLog.push(locationError);
                if (onError) onError(locationError);
            },
            this.options
        );
    }

    stopWatching(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    getLastPosition(): Coordinates | null {
        return this.lastPosition;
    }

    getErrorLog(): LocationError[] {
        return [...this.errorLog];
    }

    clearErrorLog(): void {
        this.errorLog.length = 0;
    }

    private getErrorMessage(error: GeolocationPositionError): string {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location permission denied by user';
            case error.POSITION_UNAVAILABLE:
                return 'Location information is unavailable';
            case error.TIMEOUT:
                return 'Location request timed out';
            default:
                return 'An unknown error occurred';
        }
    }

    formatCoordinates(coords: Coordinates): string {
        return `${coords.latitude.toFixed(6)}°${coords.latitude >= 0 ? 'N' : 'S'}, ` +
               `${coords.longitude.toFixed(6)}°${coords.longitude >= 0 ? 'E' : 'W'}`;
    }

    getGoogleMapsUrl(coords: Coordinates): string {
        return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    }

    calculateDistance(targetCoords: Coordinates): number | null {
        if (!this.lastPosition) return null;

        const R = 6371e3; // Earth's radius in meters
        const φ1 = this.toRadians(this.lastPosition.latitude);
        const φ2 = this.toRadians(targetCoords.latitude);
        const Δφ = this.toRadians(targetCoords.latitude - this.lastPosition.latitude);
        const Δλ = this.toRadians(targetCoords.longitude - this.lastPosition.longitude);

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }
}

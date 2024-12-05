/**
 * Shared utilities for mobile platforms
 */

// Platform detection
export const Platform = {
    isIOS: typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent),
    isWeb: typeof navigator !== 'undefined' && !(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
};

// Device orientation
export const Orientation = {
    get current(): 'portrait' | 'landscape' {
        if (typeof window === 'undefined') return 'portrait';
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    },

    addListener(callback: (orientation: 'portrait' | 'landscape') => void) {
        if (typeof window === 'undefined') return () => { };
        const handler = () => callback(this.current);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }
};

// Screen dimensions
export const Screen = {
    get width(): number {
        return typeof window !== 'undefined' ? window.innerWidth : 0;
    },
    get height(): number {
        return typeof window !== 'undefined' ? window.innerHeight : 0;
    },
    get scale(): number {
        return typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    }
};

// Safe area insets
export const SafeArea = {
    get top(): number {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
    },
    get bottom(): number {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
    },
    get left(): number {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left')) || 0;
    },
    get right(): number {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right')) || 0;
    }
};

// Network status
export const Network = {
    get isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    },

    addListener(callback: (isOnline: boolean) => void) {
        if (typeof window === 'undefined') return () => { };
        const onOnline = () => callback(true);
        const onOffline = () => callback(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }
};

// Location services
export class LocationService {
    private static instance: LocationService;
    private watchId: number | null = null;

    private constructor() { }

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    async requestPermission(): Promise<boolean> {
        try {
            if (!navigator.geolocation) return false;
            const result = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            return !!result;
        } catch (error) {
            return false;
        }
    }

    startWatching(
        onLocation: (position: GeolocationPosition) => void,
        onError?: (error: GeolocationPositionError) => void,
        options: PositionOptions = {}
    ): void {
        if (!navigator.geolocation) return;
        this.watchId = navigator.geolocation.watchPosition(
            onLocation,
            onError,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
                ...options
            }
        );
    }

    stopWatching(): void {
        if (this.watchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}

// Storage utilities
export class Storage {
    static async set(key: string, value: any): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    static async remove(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from storage:', error);
        }
    }

    static async clear(): Promise<void> {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

// Device information
export const Device = {
    get userAgent(): string {
        return typeof navigator !== 'undefined' ? navigator.userAgent : '';
    },

    get language(): string {
        return typeof navigator !== 'undefined' ?
            (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0] :
            'en';
    },

    get isOnline(): boolean {
        return Network.isOnline;
    },

    get isPWA(): boolean {
        return typeof window !== 'undefined' &&
            window.matchMedia('(display-mode: standalone)').matches;
    }
};

// Responsive utilities
export const Responsive = {
    isMobile(): boolean {
        return typeof window !== 'undefined' && window.innerWidth <= 768;
    },

    isTablet(): boolean {
        return typeof window !== 'undefined' &&
            window.innerWidth > 768 && window.innerWidth <= 1024;
    },

    isDesktop(): boolean {
        return typeof window !== 'undefined' && window.innerWidth > 1024;
    },

    addBreakpointListener(callback: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void) {
        if (typeof window === 'undefined') return () => { };

        const handler = () => {
            if (this.isMobile()) callback('mobile');
            else if (this.isTablet()) callback('tablet');
            else callback('desktop');
        };

        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }
};

// Performance monitoring
export const Performance = {
    mark(name: string): void {
        if (typeof performance !== 'undefined') {
            performance.mark(name);
        }
    },

    measure(name: string, startMark: string, endMark: string): void {
        if (typeof performance !== 'undefined') {
            try {
                performance.measure(name, startMark, endMark);
            } catch (error) {
                console.error('Error measuring performance:', error);
            }
        }
    },

    getMetrics(): PerformanceEntries {
        if (typeof performance === 'undefined') return {};

        return {
            navigation: performance.getEntriesByType('navigation'),
            resource: performance.getEntriesByType('resource'),
            marks: performance.getEntriesByType('mark'),
            measures: performance.getEntriesByType('measure')
        };
    }
};

interface PerformanceEntries {
    navigation?: PerformanceEntry[];
    resource?: PerformanceEntry[];
    marks?: PerformanceEntry[];
    measures?: PerformanceEntry[];
}

// Error handling
export class ErrorBoundary {
    static handleError(error: Error, componentStack: string): void {
        console.error('Error caught by boundary:', error);
        console.error('Component stack:', componentStack);

        // Log to analytics or error tracking service
        this.logError({
            error: error.toString(),
            stack: error.stack,
            componentStack,
            timestamp: new Date().toISOString(),
            platform: Platform.isIOS ? 'ios' : Platform.isAndroid ? 'android' : 'web',
            deviceInfo: {
                userAgent: Device.userAgent,
                language: Device.language,
                online: Device.isOnline,
                screen: {
                    width: Screen.width,
                    height: Screen.height,
                    scale: Screen.scale
                }
            }
        });
    }

    private static logError(errorInfo: any): void {
        // Implement error logging logic here
        console.log('Error logged:', errorInfo);
    }
}

// Haptic feedback
export const Haptics = {
    impact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
        if (typeof navigator === 'undefined') return;

        if ((navigator as any).vibrate) {
            switch (style) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(30);
                    break;
            }
        }
    },

    notification(type: 'success' | 'warning' | 'error'): void {
        if (typeof navigator === 'undefined') return;

        if ((navigator as any).vibrate) {
            switch (type) {
                case 'success':
                    navigator.vibrate([10, 30, 10]);
                    break;
                case 'warning':
                    navigator.vibrate([30, 100, 30]);
                    break;
                case 'error':
                    navigator.vibrate([50, 100, 50, 100, 50]);
                    break;
            }
        }
    }
};

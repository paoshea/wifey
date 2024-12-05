export class LocationError extends Error {
    constructor(
        message: string,
        public code: LocationErrorCode,
        public originalError?: GeolocationPositionError | Error
    ) {
        super(message);
        this.name = 'LocationError';
    }
}

export enum LocationErrorCode {
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
    TIMEOUT = 'TIMEOUT',
    UNSUPPORTED = 'UNSUPPORTED',
    TRACKING_FAILED = 'TRACKING_FAILED',
    UNKNOWN = 'UNKNOWN'
}

export function parseGeolocationError(error: GeolocationPositionError): LocationError {
    let message: string;
    let code: LocationErrorCode;

    switch (error.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
            message = 'Location permission denied';
            code = LocationErrorCode.PERMISSION_DENIED;
            break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            code = LocationErrorCode.POSITION_UNAVAILABLE;
            break;
        case GeolocationPositionError.TIMEOUT:
            message = 'Location request timed out';
            code = LocationErrorCode.TIMEOUT;
            break;
        default:
            message = 'Unknown location error';
            code = LocationErrorCode.UNKNOWN;
    }

    return new LocationError(message, code, error);
}

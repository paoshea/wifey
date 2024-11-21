import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from './error-handler';

// Base schemas for common fields
const baseCoordinates = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const baseTimestamp = z.string().datetime();

// Coverage point validation schemas
export const coveragePointSchema = z.object({
  location: baseCoordinates,
  signalStrength: z.number().min(0).max(100),
  provider: z.string().min(1),
  type: z.enum(['cellular', 'wifi']),
  technology: z.enum(['2G', '3G', '4G', '5G']),
  reliability: z.number().min(0).max(1),
  timestamp: baseTimestamp.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Coverage search validation schema
export const coverageSearchSchema = z.object({
  bounds: z.object({
    minLat: z.number().min(-90).max(90),
    maxLat: z.number().min(-90).max(90),
    minLng: z.number().min(-180).max(180),
    maxLng: z.number().min(-180).max(180),
  }),
  provider: z.string().optional(),
  type: z.enum(['cellular', 'wifi']).optional(),
  minSignalStrength: z.number().min(0).max(100).optional(),
  timeRange: z.object({
    start: baseTimestamp,
    end: baseTimestamp,
  }).optional(),
});

// User contribution validation schema
export const contributionSchema = z.object({
  userId: z.string().min(1),
  coveragePoint: coveragePointSchema,
  deviceInfo: z.object({
    type: z.string(),
    model: z.string(),
    os: z.string(),
  }).optional(),
});

// Distance calculation validation schema
export const distanceCalculationSchema = z.object({
  point1: baseCoordinates,
  point2: baseCoordinates,
});

// Validation middleware creator
export function validateRequest<T extends z.ZodType>(schema: T) {
  return async function(
    req: NextRequest,
    handler: (validatedData: z.infer<T>) => Promise<NextResponse>
  ) {
    try {
      // Parse query parameters for GET requests
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        
        // Convert string numbers to actual numbers
        const parsedParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
          const numberValue = Number(value);
          acc[key] = !isNaN(numberValue) ? numberValue : value;
          return acc;
        }, {} as Record<string, any>);

        const validatedData = await schema.parseAsync(parsedParams);
        return handler(validatedData);
      }

      // Parse body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        const body = await req.json();
        const validatedData = await schema.parseAsync(body);
        return handler(validatedData);
      }

      throw new Error(`Unsupported method: ${req.method}`);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Example usage in API route:
/*
export async function POST(req: NextRequest) {
  return validateRequest(contributionSchema)(req, async (data) => {
    // Handle validated data
    const contribution = await saveContribution(data);
    return NextResponse.json(contribution);
  });
}
*/

// Validation helper functions
export function validateCoordinates(lat: number, lng: number): boolean {
  return baseCoordinates.safeParse({ latitude: lat, longitude: lng }).success;
}

export function validateSignalStrength(strength: number): boolean {
  return z.number().min(0).max(100).safeParse(strength).success;
}

export function validateProvider(provider: string): boolean {
  return z.string().min(1).safeParse(provider).success;
}

export function validateTechnology(tech: string): boolean {
  return z.enum(['2G', '3G', '4G', '5G']).safeParse(tech).success;
}

// Custom error messages
export const validationErrors = {
  coordinates: {
    invalid: 'Invalid coordinates provided',
    outOfRange: 'Coordinates are out of valid range',
  },
  signalStrength: {
    invalid: 'Invalid signal strength value',
    outOfRange: 'Signal strength must be between 0 and 100',
  },
  provider: {
    invalid: 'Invalid provider name',
    required: 'Provider name is required',
  },
  technology: {
    invalid: 'Invalid technology type',
    unsupported: 'Unsupported technology type',
  },
  timestamp: {
    invalid: 'Invalid timestamp format',
    future: 'Timestamp cannot be in the future',
  },
  bounds: {
    invalid: 'Invalid bounds provided',
    tooLarge: 'Search area is too large',
  },
} as const;

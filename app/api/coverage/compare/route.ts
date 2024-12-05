import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import type { CoverageReport } from '@prisma/client';
import { getDistance, getBoundingBox } from 'lib/utils/geo';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth.config';
import { prisma } from 'lib/prisma';

// Mark route as dynamic since it uses request.url and headers
export const dynamic = 'force-dynamic';

// Input validation schema
const querySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().default(1000), // Default radius of 1km
});

interface ProviderAnalysis {
  avgSignal: number;
  avgSpeed: number | null;
  points: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const input = querySchema.parse({
      lat: parseFloat(searchParams.get('lat') || '0'),
      lng: parseFloat(searchParams.get('lng') || '0'),
      radius: parseFloat(searchParams.get('radius') || '1000'),
    });

    const { lat, lng, radius } = input;
    const box = getBoundingBox(lat, lng, radius);

    // Get coverage points within the bounding box
    const points = await prisma.coverageReport.findMany({
      where: {
        AND: [
          { latitude: { gte: box.minLat, lte: box.maxLat } },
          { longitude: { gte: box.minLon, lte: box.maxLon } },
        ],
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        signal: true,
        speed: true,
        createdAt: true,
        updatedAt: true,
        operator: true,
      },
    });

    // Filter points within actual radius using Haversine formula
    const filteredPoints = points.filter(point =>
      getDistance(lat, lng, point.latitude, point.longitude) <= radius
    );

    // Group and analyze by provider
    const providerMap = new Map<string, ProviderAnalysis>();

    filteredPoints.forEach(point => {
      const provider = point.operator || 'Unknown';
      const current = providerMap.get(provider) || {
        avgSignal: 0,
        avgSpeed: 0,
        points: 0,
      };

      current.avgSignal = (current.avgSignal * current.points + point.signal) / (current.points + 1);
      if (point.speed) {
        current.avgSpeed = ((current.avgSpeed || 0) * current.points + point.speed) / (current.points + 1);
      }
      current.points++;

      providerMap.set(provider, current);
    });

    // Format points for the response
    const formattedPoints = filteredPoints.map(point => ({
      location: {
        lat: point.latitude,
        lng: point.longitude,
      },
      provider: point.operator || 'Unknown',
      signalStrength: point.signal,
      speed: point.speed,
      timestamp: point.createdAt,
    }));

    return NextResponse.json({
      points: formattedPoints,
      analysis: Object.fromEntries(providerMap),
    });
  } catch (error) {
    console.error('Coverage comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to compare coverage' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';

const prisma = new PrismaClient();

// Prisma return type
type PrismaCoveragePoint = Prisma.CoveragePointGetPayload<{}>;

interface CoveragePoint extends Omit<PrismaCoveragePoint, 'location'> {
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface ProviderAnalysis {
  provider: string;
  averageSignalStrength: number;
  coveragePoints: number;
  reliabilityScore: number;
  technologies: { [key: string]: number };
  recentUpdates: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000'); // 5km default radius

    // Convert radius to radians (MongoDB uses radians for $centerSphere)
    const radiusInRadians = radius / 6371000; // Earth's radius in meters

    // Get coverage points for all providers in the area
    const prismaPoints = await prisma.coveragePoint.findMany({
      where: {
        location: {
          near: {
            latitude: lat,
            longitude: lng,
          },
          within: {
            radius: radiusInRadians,
          },
        } as any, // Type assertion needed for MongoDB-specific query
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Convert Prisma points to CoveragePoint type
    const coveragePoints: CoveragePoint[] = prismaPoints.map(point => ({
      ...point,
      location: point.location as CoveragePoint['location'],
    }));

    // Group and analyze coverage by provider
    const providerAnalysis = analyzeProviderCoverage(coveragePoints);

    return NextResponse.json({
      coveragePoints,
      providerAnalysis,
    });
  } catch (error) {
    console.error('Error in coverage comparison:', error);
    return NextResponse.json(
      { error: 'Failed to compare coverage' },
      { status: 500 }
    );
  }
}

function analyzeProviderCoverage(coveragePoints: CoveragePoint[]): ProviderAnalysis[] {
  // Group points by provider
  const providerGroups = coveragePoints.reduce((groups, point) => {
    const group = groups.get(point.provider) || {
      provider: point.provider,
      points: [],
      technologies: new Map<string, number>(),
    };
    
    group.points.push(point);
    group.technologies.set(
      point.technology,
      (group.technologies.get(point.technology) || 0) + 1
    );
    
    groups.set(point.provider, group);
    return groups;
  }, new Map());

  // Convert grouped data to analysis
  return Array.from(providerGroups.entries()).map(([provider, group]) => {
    const points = group.points;
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      provider,
      averageSignalStrength: points.reduce((sum: number, p: CoveragePoint) => sum + p.signalStrength, 0) / points.length,
      coveragePoints: points.length,
      reliabilityScore: points.reduce((sum: number, p: CoveragePoint) => sum + p.reliability, 0) / points.length,
      technologies: Object.fromEntries(group.technologies),
      recentUpdates: points.filter((p: CoveragePoint) => p.timestamp > recentThreshold).length,
    };
  });
}

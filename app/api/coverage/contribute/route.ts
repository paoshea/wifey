import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// Helper function to calculate predicted coverage area
function calculatePredictedArea(point: { lat: number; lng: number }, signalStrength: number) {
  const radius = signalStrength * 100; // Basic radius calculation based on signal strength
  const points = [];
  const segments = 32;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const lat = point.lat + (radius / 111000) * Math.cos(angle);
    const lng = point.lng + (radius / (111000 * Math.cos(point.lat * Math.PI / 180))) * Math.sin(angle);
    points.push([lat, lng]);
  }
  // Close the polygon
  points.push(points[0]);

  return {
    type: 'Polygon',
    coordinates: [points]
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      location,
      signalStrength,
      provider,
      type,
      technology,
      metadata
    } = body;

    if (!location || typeof signalStrength !== 'number' || !provider || !type || !technology) {
      return NextResponse.json(
        { error: 'Invalid coverage point data' },
        { status: 400 }
      );
    }

    // Calculate predicted coverage area
    const predictedArea = calculatePredictedArea(location, signalStrength);

    // Create coverage point with user contribution
    const coveragePoint = await prisma.coveragePoint.create({
      data: {
        location,
        signalStrength,
        provider,
        type,
        technology,
        reliability: 1.0, // Initial reliability score
        userId: session.user?.id,
        predictedArea,
        metadata: metadata || {},
        history: {
          create: {
            signalStrength,
            metadata: metadata || {},
            userId: session.user?.id,
          },
        },
      },
      include: {
        history: true,
      },
    });

    // Update coverage comparison data
    await updateCoverageComparison(location, provider, signalStrength);

    return NextResponse.json(coveragePoint);
  } catch (error) {
    console.error('Error creating coverage point:', error);
    return NextResponse.json(
      { error: 'Failed to create coverage point' },
      { status: 500 }
    );
  }
}

async function updateCoverageComparison(
  location: { lat: number; lng: number },
  provider: string,
  signalStrength: number
) {
  try {
    // Find existing comparison or create new one
    let comparison = await prisma.coverageComparison.findFirst({
      where: {
        location: {
          equals: location
        },
      },
    });

    const providerData = {
      provider,
      signalStrength,
      timestamp: new Date(),
    };

    if (comparison) {
      // Update existing comparison
      const providers = comparison.providers as any[];
      const existingIndex = providers.findIndex(p => p.provider === provider);

      if (existingIndex >= 0) {
        providers[existingIndex] = providerData;
      } else {
        providers.push(providerData);
      }

      await prisma.coverageComparison.update({
        where: { id: comparison.id },
        data: {
          providers: providers,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new comparison
      await prisma.coverageComparison.create({
        data: {
          location: location,
          providers: [providerData],
        },
      });
    }
  } catch (error) {
    console.error('Error updating coverage comparison:', error);
  }
}

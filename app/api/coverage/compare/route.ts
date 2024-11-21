import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000'); // 5km default radius

    // Get coverage points for all providers in the area
    const coveragePoints = await prisma.coveragePoint.findMany({
      where: {
        location: {
          // Using MongoDB $geoWithin operator
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371000] // Convert radius to radians
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Group and analyze coverage by provider
    const providerAnalysis = analyzeProviderCoverage(coveragePoints);

    // Get historical comparison data
    const historicalComparison = await prisma.coverageComparison.findMany({
      where: {
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371000]
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Limit to recent comparisons
    });

    // Combine current and historical data
    const comparisonResult = {
      currentCoverage: providerAnalysis,
      historicalData: historicalComparison,
      metadata: {
        timestamp: new Date(),
        location: { lat, lng },
        radius
      }
    };

    return NextResponse.json(comparisonResult);
  } catch (error) {
    console.error('Error comparing coverage:', error);
    return NextResponse.json(
      { error: 'Failed to compare coverage' },
      { status: 500 }
    );
  }
}

function analyzeProviderCoverage(coveragePoints: any[]) {
  const providerMap = new Map();

  // Group points by provider
  coveragePoints.forEach(point => {
    if (!providerMap.has(point.provider)) {
      providerMap.set(point.provider, []);
    }
    providerMap.get(point.provider).push(point);
  });

  const analysis = [];

  // Analyze each provider's coverage
  for (const [provider, points] of providerMap.entries()) {
    const signalStrengths = points.map((p: any) => p.signalStrength);
    const avgSignalStrength = signalStrengths.reduce((a: number, b: number) => a + b, 0) / signalStrengths.length;
    
    const technologies = new Set(points.map((p: any) => p.technology));
    const reliability = points.reduce((acc: number, p: any) => acc + p.reliability, 0) / points.length;

    // Calculate coverage density
    const uniqueLocations = new Set(points.map((p: any) => `${p.location.lat},${p.location.lng}`));
    const coverageDensity = uniqueLocations.size / points.length;

    analysis.push({
      provider,
      averageSignalStrength: avgSignalStrength,
      technologies: Array.from(technologies),
      reliability,
      coverageDensity,
      totalPoints: points.length,
      recentPoints: points.filter((p: any) => {
        const pointAge = Date.now() - new Date(p.timestamp).getTime();
        return pointAge < 7 * 24 * 60 * 60 * 1000; // Points from last 7 days
      }).length,
      strengthDistribution: {
        excellent: signalStrengths.filter(s => s >= 80).length,
        good: signalStrengths.filter(s => s >= 60 && s < 80).length,
        fair: signalStrengths.filter(s => s >= 40 && s < 60).length,
        poor: signalStrengths.filter(s => s < 40).length,
      }
    });
  }

  return analysis;
}

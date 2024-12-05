import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth.config';
import { Prisma } from '@prisma/client';
import { StatsContent } from 'lib/gamification/types';

const contributionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  signal: z.number().min(-150).max(0), // Signal strength in dBm
  speed: z.number().optional(),
  operator: z.string(),        // Required field
  networkType: z.string(),     // Required field
  deviceModel: z.string(),     // Required field
  connectionType: z.string(),  // Required field
});

type DbStats = {
  id: string;
  userId: string;
  points: number;
};

const StatsContentSchema = z.object({
  totalMeasurements: z.number(),
  contributionScore: z.number(),
  ruralMeasurements: z.number(),
  uniqueLocations: z.number(),
  totalDistance: z.number(),
  qualityScore: z.number(),
  accuracyRate: z.number(),
  verifiedSpots: z.number(),
  helpfulActions: z.number(),
  consecutiveDays: z.number(),
  points: z.number()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = contributionSchema.parse(body);

    const now = new Date();

    // Create coverage report
    const coverageReport = await prisma.coverageReport.create({
      data: {
        userId: session.user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        signal: BigInt(data.signal),
        speed: data.speed,
        operator: data.operator,
        networkType: data.networkType,
        deviceModel: data.deviceModel,
        connectionType: data.connectionType,
        createdAt: now,
        updatedAt: now,
        points: BigInt(0),
        verified: false
      } as Prisma.CoverageReportUncheckedCreateInput,
    });

    // Get current stats or initialize new ones
    const result = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        points: true
      }
    });

    // Cast the result to our known type
    const currentStats = result as DbStats | null;

    // Get the current points
    const currentPoints = currentStats?.points || 0;

    // Initialize stats with default values
    const statsForValidation = {
      totalMeasurements: currentPoints + 1,
      contributionScore: currentPoints + 1,
      ruralMeasurements: 0,
      uniqueLocations: 0,
      totalDistance: 0,
      qualityScore: 0,
      accuracyRate: 0,
      verifiedSpots: 0,
      helpfulActions: 0,
      consecutiveDays: 0,
      points: currentPoints + 1
    };

    // Validate stats
    const validatedStats = StatsContentSchema.parse(statsForValidation);

    if (!currentStats) {
      // If no stats exist, create new record
      await prisma.userStats.create({
        data: {
          userId: session.user.id,
          points: 1,
          stats: {}
        } as Prisma.UserStatsUncheckedCreateInput
      });
    } else {
      // If stats exist, update them
      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: {
          points: { increment: 1 }
        } as Prisma.UserStatsUncheckedUpdateInput
      });
    }

    return NextResponse.json({
      success: true,
      coverageReport,
      stats: validatedStats,
    });

  } catch (error) {
    console.error('Error in coverage contribution:', error);
    return NextResponse.json(
      { error: 'Failed to process contribution' },
      { status: 500 }
    );
  }
}

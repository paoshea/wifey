import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { Prisma } from '@prisma/client';
import { StatsContentSchema } from '@/lib/gamification/types';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = contributionSchema.parse(body);

    // Create coverage report
    const coverageReport = await prisma.coverageReport.create({
      data: {
        userId: session.user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        signal: data.signal,
        speed: data.speed,
        operator: data.operator,
        networkType: data.networkType,
        deviceModel: data.deviceModel,
        connectionType: data.connectionType,
      } as Prisma.CoverageReportUncheckedCreateInput,
    });

    // Get current stats or initialize new ones
    const currentStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        points: true,
        statsData: true
      }
    });

    const defaultStats = {
      totalMeasurements: 0,
      ruralMeasurements: 0,
      uniqueLocations: 0,
      totalDistance: 0,
      contributionScore: 0,
      qualityScore: 0,
      accuracyRate: 0,
      verifiedSpots: 0,
      helpfulActions: 0,
      consecutiveDays: 0
    };

    // Type assertion for the JSON data
    const stats = currentStats?.statsData as Record<string, number> || defaultStats;

    // Update stats
    const updatedStats = {
      ...stats,
      totalMeasurements: stats.totalMeasurements + 1,
      contributionScore: stats.contributionScore + 1
    };

    // Validate updated stats
    const validatedStats = StatsContentSchema.parse(updatedStats);

    // Create data with proper Prisma types
    const createData: Prisma.UserStatsUncheckedCreateInput = {
      userId: session.user.id,
      points: 0,
      statsData: validatedStats as Prisma.InputJsonValue
    };

    const updateData: Prisma.UserStatsUncheckedUpdateInput = {
      statsData: validatedStats as Prisma.InputJsonValue
    };

    // Update user stats
    await prisma.userStats.upsert({
      where: {
        userId: session.user.id,
      },
      create: createData,
      update: updateData
    });

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
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import { Prisma } from '@prisma/client';

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
        lat: data.latitude,
        lng: data.longitude,
        signal: data.signal,
        speed: data.speed,
        operator: data.operator,
        networkType: data.networkType,
        deviceModel: data.deviceModel,
        connectionType: data.connectionType,
      } as Prisma.CoverageReportUncheckedCreateInput,
    });

    // Update user stats
    await prisma.userStats.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        totalMeasurements: { increment: 1 },
        contributionScore: { increment: 1 },
      },
      create: {
        userId: session.user.id,
        totalMeasurements: 1,
        contributionScore: 1,
      },
    });

    return NextResponse.json({
      message: 'Coverage report submitted successfully',
      coverageReport,
    });

  } catch (error) {
    console.error('Coverage contribution error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to submit coverage report' },
      { status: 500 }
    );
  }
}
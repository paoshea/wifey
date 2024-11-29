import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';

const contributionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  operator: z.enum(['KOLBI', 'MOVISTAR', 'CLARO', 'LIBERTY']),
  signal: z.number().int().min(-150).max(0),
  speed: z.number().optional(),
  networkType: z.string().optional(),
  deviceInfo: z.record(z.unknown()).optional(),
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
        latitude: data.latitude,
        longitude: data.longitude,
        operator: data.operator,
        signal: data.signal,
        speed: data.speed,
        userId: session.user.id,
        points: 5, // Default points for contribution
      },
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

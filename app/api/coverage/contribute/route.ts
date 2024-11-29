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
  signal: z.number().min(-150).max(0),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  networkType: z.string(),
  deviceModel: z.string(),
  isRoaming: z.boolean().optional(),
  isIndoor: z.boolean().optional(),
  batteryLevel: z.number().optional(),
  temperature: z.number().optional(),
  connectionType: z.string(),
  cellId: z.string().optional(),
  mcc: z.string().optional(),
  mnc: z.string().optional(),
  lac: z.string().optional(),
  rsrp: z.number().optional(),
  rsrq: z.number().optional(),
  rssi: z.number().optional(),
  rssnr: z.number().optional(),
  cqi: z.number().int().optional(),
  timingAdvance: z.number().int().optional(),
  asu: z.number().int().optional(),
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
        operator: data.operator,
        signal: data.signal,
        speed: data.speed,
        accuracy: data.accuracy,
        altitude: data.altitude,
        networkType: data.networkType,
        deviceModel: data.deviceModel,
        isRoaming: data.isRoaming ?? false,
        isIndoor: data.isIndoor ?? false,
        batteryLevel: data.batteryLevel,
        temperature: data.temperature,
        connectionType: data.connectionType,
        cellId: data.cellId,
        mcc: data.mcc,
        mnc: data.mnc,
        lac: data.lac,
        rsrp: data.rsrp,
        rsrq: data.rsrq,
        rssi: data.rssi,
        rssnr: data.rssnr,
        cqi: data.cqi,
        timingAdvance: data.timingAdvance,
        asu: data.asu,
        points: 10, // Default points for contribution
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

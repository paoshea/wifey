// measurements/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { detectCarrier } from '@/lib/carriers/detection';
import { GamificationService } from '@/lib/services/gamification-service';
import { Prisma } from '@prisma/client';
import { SignalMeasurement } from '@/lib/types/monitoring';

// Validation schema for measurements
const MeasurementSchema = z.object({
  signalStrength: z.number().min(0).max(4),
  technology: z.enum(['2G', '3G', '4G', '5G']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  provider: z.string().optional(),
  connectionType: z.string().optional(),
  timestamp: z.number(),
  device: z.object({
    model: z.string().optional(),
    platform: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
});

type MeasurementInput = z.infer<typeof MeasurementSchema>;
type BatchMeasurementInput = MeasurementInput[];

const BatchMeasurementsSchema = z.array(MeasurementSchema).max(100);

// Helper function to convert MeasurementInput to SignalMeasurement
function toSignalMeasurement(input: MeasurementInput): SignalMeasurement {
  return {
    timestamp: input.timestamp,
    carrier: input.provider || 'unknown',
    network: input.technology,
    networkType: input.technology,
    geolocation: input.location,
    signalStrength: input.signalStrength,
    technology: input.technology,
    provider: input.provider || 'unknown',
    connectionType: input.connectionType,
    device: {
      type: input.device?.platform || 'unknown',
      model: input.device?.model || 'unknown',
      os: input.device?.platform || 'unknown'
    }
  };
}

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const authResult = await auth();

    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.session.user.id;

    // Parse and validate request body
    const rawData = await request.json();
    const measurements = Array.isArray(rawData) ? rawData : [rawData];

    const validationResult = BatchMeasurementsSchema.safeParse(measurements);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid measurement data', details: validationResult.error },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      validationResult.data.map(async (measurement: MeasurementInput) => {
        // Convert to SignalMeasurement type and detect carrier
        const signalMeasurement = toSignalMeasurement(measurement);
        const provider = measurement.provider || await detectCarrier(signalMeasurement);

        // Create measurement record
        const result = await prisma.measurement.create({
          data: {
            userId,
            type: 'signal',
            value: measurement.signalStrength,
            unit: 'level',
            location: measurement.location as Prisma.InputJsonValue,
            timestamp: new Date(measurement.timestamp),
            device: measurement.device || {} as Prisma.InputJsonValue,
            metadata: {
              technology: measurement.technology,
              provider,
              connectionType: measurement.connectionType,
            } as Prisma.InputJsonValue,
          },
        });

        // Create or update coverage point
        const coveragePoint = await prisma.coveragePoint.upsert({
          where: {
            provider_type_location_unique: {
              provider,
              type: 'cellular',
              location: measurement.location as Prisma.InputJsonValue,
            }
          },
          update: {
            signalStrength: measurement.signalStrength,
            technology: measurement.technology,
            reliability: 1.0,
            lastVerified: new Date(),
            verifications: {
              increment: 1
            },
            metadata: {
              technology: measurement.technology,
              provider,
              connectionType: measurement.connectionType,
            } as Prisma.InputJsonValue,
          },
          create: {
            location: measurement.location as Prisma.InputJsonValue,
            signalStrength: measurement.signalStrength,
            provider,
            type: 'cellular',
            technology: measurement.technology,
            reliability: 1.0,
            userId,
            metadata: {
              technology: measurement.technology,
              provider,
              connectionType: measurement.connectionType,
            } as Prisma.InputJsonValue,
          },
        });

        // Process measurement for gamification
        await GamificationService.processMeasurement(result, userId);

        return { measurement: result, coveragePoint };
      })
    );

    // Get updated user progress for response
    const userProgress = await GamificationService.getUserProgress(userId);

    return NextResponse.json({
      success: true,
      processed: results.length,
      measurements: results,
      gamification: {
        progress: userProgress,
      },
    });
  } catch (error) {
    console.error('Error processing measurements:', error);
    return NextResponse.json(
      { error: 'Failed to process measurements' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await auth();

    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.session.user.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const provider = searchParams.get('provider');

    const query: any = {
      userId,
      type: type || 'signal',
    };

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.gte = new Date(Number(startTime));
      if (endTime) query.timestamp.lte = new Date(Number(endTime));
    }

    if (provider) {
      query.metadata = {
        path: ['provider'],
        equals: provider,
      };
    }

    const measurements = await prisma.measurement.findMany({
      where: query,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}
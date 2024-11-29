// app/api/measurements/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { detectCarrier } from '@/lib/carriers/detection';
import { GamificationService } from '@/lib/services/gamification-service';
import { Prisma } from '@prisma/client';
import { SignalMeasurement } from '@/lib/types/monitoring';

// Initialize services
const gamificationService = new GamificationService(prisma);

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
            latitude: measurement.location.lat,
            longitude: measurement.location.lng,
            timestamp: new Date(measurement.timestamp),
            deviceInfo: measurement.device || {} as Prisma.InputJsonValue,
            metadata: {
              technology: measurement.technology,
              provider,
              connectionType: measurement.connectionType,
            } as Prisma.InputJsonValue,
            networkType: measurement.technology,
            operator: provider,
            signalStrength: Math.round(measurement.signalStrength * 100), // Convert 0-4 to 0-100 scale
            points: 10,
            isRural: false, // This will be calculated by a background job
          },
        });

        // Process the measurement for gamification
        await gamificationService.processMeasurement({
          userId,
          type: 'signal',
          value: measurement.signalStrength,
          latitude: measurement.location.lat,
          longitude: measurement.location.lng,
          isRural: false,
          isFirstInArea: false, // This will be calculated by a background job
          operator: provider,
          networkType: measurement.technology,
        });

        return result;
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error processing measurements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const searchParams = new URL(request.url).searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
      }),
      prisma.measurement.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      measurements,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
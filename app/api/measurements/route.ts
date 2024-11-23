import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { detectCarrier } from '@/lib/carriers/detection';
import { gamificationService } from '@/lib/services/gamification-service';

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

const BatchMeasurementsSchema = z.array(MeasurementSchema).max(100);

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const rawData = await request.json();
    const measurements = Array.isArray(rawData) ? rawData : [rawData];
    
    try {
      BatchMeasurementsSchema.parse(measurements);
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid measurement data', details: validationError },
        { status: 400 }
      );
    }

    // Process measurements
    const processedMeasurements = await Promise.all(
      measurements.map(async (measurement) => {
        // Detect carrier if not provided
        const provider = measurement.provider || await detectCarrier(measurement);

        // Create measurement record
        const dbMeasurement = await prisma.measurement.create({
          data: {
            userId,
            type: 'signal',
            value: measurement.signalStrength,
            unit: 'level',
            location: measurement.location,
            timestamp: new Date(measurement.timestamp),
            device: measurement.device || {},
            metadata: {
              technology: measurement.technology,
              provider,
              connectionType: measurement.connectionType,
            },
          },
        });

        // Create or update coverage point
        const coveragePoint = await prisma.coveragePoint.upsert({
          where: {
            location_provider_type: {
              location: measurement.location,
              provider,
              type: 'cellular',
            },
          },
          update: {
            signalStrength: {
              increment: measurement.signalStrength,
            },
            verifications: {
              increment: 1,
            },
            lastVerified: new Date(),
            history: {
              create: {
                signalStrength: measurement.signalStrength,
                userId,
                metadata: {
                  technology: measurement.technology,
                  device: measurement.device,
                },
              },
            },
          },
          create: {
            location: measurement.location,
            signalStrength: measurement.signalStrength,
            provider,
            type: 'cellular',
            technology: measurement.technology,
            reliability: 1,
            userId,
            verifications: 1,
            history: {
              create: {
                signalStrength: measurement.signalStrength,
                userId,
                metadata: {
                  technology: measurement.technology,
                  device: measurement.device,
                },
              },
            },
          },
        });

        // Process measurement for gamification
        await gamificationService.processMeasurement(dbMeasurement, userId);

        return { measurement: dbMeasurement, coveragePoint };
      })
    );

    // Get updated user progress for response
    const userProgress = await gamificationService.getUserProgress(userId);

    return NextResponse.json({
      success: true,
      processed: processedMeasurements.length,
      measurements: processedMeasurements,
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
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
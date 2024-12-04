import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { z } from 'zod';
import prisma from '../../../lib/prisma';
import { measurementSchema } from '../../../lib/validations/measurement';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Location schema for measurement validation
const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

// Device schema for measurement validation
const DeviceSchema = z.object({
  platform: z.string().optional(),
  model: z.string().optional(),
});

// Schema for individual measurement validation
const MeasurementSchema = z.object({
  signalStrength: z.number(),
  location: LocationSchema,
  connectionType: z.string(),
  technology: z.string(),
  device: DeviceSchema.optional(),
});

// Pagination schema
const PaginationSchema = z.object({
  take: z.string().transform(Number).default('10'),
  skip: z.string().transform(Number).default('0'),
});

type MeasurementInput = z.infer<typeof MeasurementSchema>;
type BatchMeasurementInput = MeasurementInput[];

const BatchMeasurementsSchema = z.array(MeasurementSchema).max(100);

// Helper function to convert MeasurementInput to database format
async function toDbMeasurement(input: MeasurementInput, userId: string) {
  return {
    userId,
    signalStrength: input.signalStrength,
    latitude: input.location.latitude,
    longitude: input.location.longitude,
    connectionType: input.connectionType,
    networkType: input.technology,
    provider: input.device?.platform || 'unknown',
    timestamp: new Date(),
  };
}

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse and validate request body
    const rawData = await request.json();
    const measurements = Array.isArray(rawData) ? rawData : [rawData];
    const validationResult = BatchMeasurementsSchema.safeParse(measurements);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid measurement data', details: validationResult.error },
        { status: 400 },
      );
    }

    // Convert inputs to database format
    const dbMeasurements = await Promise.all(
      validationResult.data.map(m => toDbMeasurement(m, userId))
    );

    // Save measurements
    const savedMeasurements = await prisma.measurement.createMany({
      data: dbMeasurements,
    });

    return NextResponse.json({
      message: 'Measurements saved successfully',
      savedCount: savedMeasurements.count,
    });
  } catch (error) {
    console.error('Error saving measurements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Get pagination parameters from URL
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const paginationResult = PaginationSchema.safeParse(searchParams);

  if (!paginationResult.success) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters' },
      { status: 400 },
    );
  }

  const { take, skip } = paginationResult.data;

  const [rawMeasurements, total] = await Promise.all([
    prisma.measurement.findRaw({
      filter: { userId },
      options: {
        sort: { timestamp: -1 },
        skip,
        limit: take
      }
    }) as Promise<Prisma.JsonObject>,
    prisma.measurement.count({
      where: { userId },
    }),
  ]);

  // Convert the raw MongoDB result to an array of measurements
  const measurements = Array.isArray(rawMeasurements) ? rawMeasurements : [];

  return NextResponse.json({
    measurements,
    total,
  });
}

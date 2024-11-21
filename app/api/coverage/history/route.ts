import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pointId = searchParams.get('pointId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!pointId) {
      return NextResponse.json(
        { error: 'Coverage point ID is required' },
        { status: 400 }
      );
    }

    const history = await prisma.coverageHistory.findMany({
      where: {
        coveragePointId: pointId,
        timestamp: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        coveragePoint: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching coverage history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coverage history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coveragePointId, signalStrength, metadata } = body;

    if (!coveragePointId || typeof signalStrength !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coverage history data' },
        { status: 400 }
      );
    }

    // Create history entry
    const historyEntry = await prisma.coverageHistory.create({
      data: {
        coveragePointId,
        signalStrength,
        metadata: metadata || {},
      },
    });

    // Update coverage point with new signal strength and last verified
    await prisma.coveragePoint.update({
      where: { id: coveragePointId },
      data: {
        signalStrength,
        lastVerified: new Date(),
        verifications: { increment: 1 },
      },
    });

    return NextResponse.json(historyEntry);
  } catch (error) {
    console.error('Error creating coverage history:', error);
    return NextResponse.json(
      { error: 'Failed to create coverage history' },
      { status: 500 }
    );
  }
}

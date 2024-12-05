import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth.config';

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

    const history = await prisma.coverageReport.findMany({
      where: {
        id: pointId,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: {
        createdAt: 'desc',
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, signal, operator, networkType, deviceModel, connectionType } = body;

    if (!latitude || !longitude || typeof signal !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coverage data' },
        { status: 400 }
      );
    }

    // Create new coverage report using direct data object
    const coverageReport = await prisma.coverageReport.create({
      data: {
        user: { connect: { id: session.user.id } },
        lat: Number(latitude),
        lng: Number(longitude),
        signal: Number(signal),
        operator: String(operator),
        networkType: String(networkType),
        deviceModel: String(deviceModel),
        connectionType: String(connectionType),
      } as any, // Temporarily bypass type checking
    });

    return NextResponse.json(coverageReport);
  } catch (error) {
    console.error('Error creating coverage report:', error);
    return NextResponse.json(
      { error: 'Failed to create coverage report' },
      { status: 500 }
    );
  }
}

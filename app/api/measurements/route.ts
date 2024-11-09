import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db();

    const measurement = await db.collection('measurements').insertOne({
      ...data,
      timestamp: new Date(),
    });

    return NextResponse.json(measurement);
  } catch (error) {
    console.error('Error saving measurement:', error);
    return NextResponse.json(
      { error: 'Failed to save measurement' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    const client = await clientPromise;
    const db = client.db();

    const query: any = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;

    const measurements = await db.collection('measurements')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json(measurements);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}
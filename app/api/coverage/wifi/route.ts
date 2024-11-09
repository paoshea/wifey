import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '500'); // meters

    const client = await clientPromise;
    const db = client.db();

    const hotspots = await db.collection('wifihotspots').find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      isPublic: true,
    }).toArray();

    return NextResponse.json(hotspots);
  } catch (error) {
    console.error('Error fetching WiFi hotspots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WiFi hotspots' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

// Mark route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '1000'); // meters

    const client = await clientPromise;
    const db = client.db();

    const coveragePoints = await db.collection('coveragepoints').find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      type: 'cellular',
    }).toArray();

    return NextResponse.json(coveragePoints);
  } catch (error) {
    console.error('Error fetching cellular coverage points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cellular coverage points' },
      { status: 500 }
    );
  }
}

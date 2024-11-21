import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse area coordinates from query parameters
    const minLat = parseFloat(searchParams.get('minLat') || '0');
    const maxLat = parseFloat(searchParams.get('maxLat') || '0');
    const minLng = parseFloat(searchParams.get('minLng') || '0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '0');

    const client = await clientPromise;
    const db = client.db();

    // Query coverage points within the specified area using MongoDB's $geoWithin
    const coveragePoints = await db.collection('coveragepoints').find({
      location: {
        $geoWithin: {
          $box: [
            [minLng, minLat], // Southwest corner
            [maxLng, maxLat]  // Northeast corner
          ]
        }
      },
      type: 'cellular',
    }).toArray();

    return NextResponse.json(coveragePoints);
  } catch (error) {
    console.error('Error fetching cellular coverage points by area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coverage points' },
      { status: 500 }
    );
  }
}
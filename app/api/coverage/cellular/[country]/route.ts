import { NextResponse } from 'next/server';
import { getAllCarriersCoverage } from '@/lib/carriers/api';

export async function GET(
  request: Request,
  { params }: { params: { country: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (params.country.toLowerCase() === 'cr') {
      const coverage = await getAllCarriersCoverage(lat, lng);
      return NextResponse.json(coverage);
    }

    return NextResponse.json(
      { error: 'Country not supported' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching carrier coverage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carrier coverage' },
      { status: 500 }
    );
  }
}
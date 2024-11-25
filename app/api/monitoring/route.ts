import { NextResponse } from 'next/server';
import type { SignalMeasurement } from '@/lib/types/monitoring';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if ('type' in data && data.type === 'analytics') {
      // Handle analytics events
      console.log('Analytics event:', data);
      return NextResponse.json(
        { success: true, type: 'analytics' },
        { headers: corsHeaders }
      );
    } else if ('timestamp' in data) {
      // Handle signal measurements
      const measurement = data as SignalMeasurement;
      console.log('Signal measurement:', measurement);
      return NextResponse.json(
        { success: true, type: 'measurement', measurement },
        { headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid data format' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function GET() {
  // TODO: Retrieve measurements from database
  // For now, return mock data
  
  const mockMeasurements: SignalMeasurement[] = [
    {
      timestamp: Date.now(),
      carrier: 'Mock Carrier',
      network: '4G',
      networkType: 'cellular',
      signalStrength: -85,
      technology: '4G',
      provider: 'Mock Provider',
      geolocation: {
        lat: 37.7749,
        lng: -122.4194
      }
    }
  ];
  
  return NextResponse.json(
    { success: true, measurements: mockMeasurements },
    { headers: corsHeaders }
  );
}

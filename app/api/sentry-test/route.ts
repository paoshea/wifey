import { NextResponse } from 'next/server';

export async function GET() {
  try {
    throw new Error('Sentry Test Error');
  } catch (error) {
    return NextResponse.json({ error: 'Test error triggered' }, { status: 500 });
  }
}
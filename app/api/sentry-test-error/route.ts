import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/i18n/get-messages';

export async function GET(request: NextRequest) {
  const locale = request.headers.get('Accept-Language') || 'en';
  const messages = await getMessages(locale);
  
  return NextResponse.json(
    { error: messages.SentryExample['API Error Message'] },
    { status: 400 }
  );
}

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultLocale } from '../lib/i18n/config';

export default function RootPage() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || 'http';

  redirect(`${protocol}://${host}/${defaultLocale}`);
}

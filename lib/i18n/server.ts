import { createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { type SupportedLocale, locales } from './config';

export async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export async function getTranslator(
  locale: SupportedLocale,
  namespace?: string
) {
  const messages = await getMessages(locale);
  return createTranslator({ locale, messages, namespace });
}

export const i18n = {
  defaultLocale: 'en' as const,
  locales,
  localePrefix: 'as-needed',
} as const;

export default getRequestConfig(async ({ locale }) => ({
  messages: await getMessages(locale),
  timeZone: 'America/Los_Angeles',
}));

import { getRequestConfig } from 'next-intl/server';

export async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    throw new Error(`Failed to load messages for locale: ${locale}`);
  }
}

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: await getMessages(locale),
    timeZone: 'America/Los_Angeles',
  };
});

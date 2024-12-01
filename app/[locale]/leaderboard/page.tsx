import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout/page-header';
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';
import { Providers } from '@/app/[locale]/providers';
import { getMessages } from '@/lib/i18n/server';
import { defaultLocale, type SupportedLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params: { locale = defaultLocale }
}: {
  params: { locale: SupportedLocale }
}): Promise<Metadata> {
  const messages = await getMessages(locale);
  const t = await getTranslations(messages, 'leaderboard');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LeaderboardPage({
  params: { locale = defaultLocale }
}: {
  params: { locale: SupportedLocale }
}) {
  const messages = await getMessages(locale);
  const timeZone = 'America/Los_Angeles'; // You might want to get this from user preferences

  return (
    <Providers locale={locale} messages={messages} timeZone={timeZone}>
      <div className="container space-y-8 py-8">
        <PageHeader
          heading={messages.leaderboard.title}
          text={messages.leaderboard.description}
        />
        <LeaderboardView />
      </div>
    </Providers>
  );
}

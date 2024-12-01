import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout/page-header';
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';
import { Providers } from '@/app/[locale]/providers';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations(locale, 'leaderboard');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');

  return (
    <Providers>
      <div className="container space-y-8 py-8">
        <PageHeader
          heading={t('title')}
          text={t('description')}
        />
        <LeaderboardView />
      </div>
    </Providers>
  );
}

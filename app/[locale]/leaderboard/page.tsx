import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('leaderboard');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LeaderboardView />
    </div>
  );
}

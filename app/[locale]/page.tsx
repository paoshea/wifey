'use client';

import { useParams } from 'next/navigation';
import { Icons } from 'components/ui/icons';
import { Badge } from 'components/ui/badge';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { MainNav } from 'components/layout/main-nav';

interface PageParams {
  locale: string;
  [key: string]: string;
}

export default function LocalePage() {
  const params = useParams() as PageParams;
  const locale = params.locale;
  const t = useTranslations('home');
  const nav = useTranslations('navigation');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <MainNav locale={locale} nav={nav} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-primary-100/20 via-transparent to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-12">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shadow-sm"
            >
              {t('featuringNow.title')}
            </Badge>
            {/* Quick Coverage Report Card */}
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {nav('report.title')}
                </h3>
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <Icons.signal className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">
                {nav('report.description')}
              </p>
              <Link
                href={`/${locale}/report`}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-medium shadow-lg hover:shadow-primary-500/25 dark:hover:shadow-primary-400/25 hover:bg-primary-700 dark:hover:bg-primary-600 transition-all group"
              >
                <Icons.plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                {nav('report.button')}
              </Link>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-zinc-900 dark:text-zinc-50 mb-6">
              {t('title')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto mb-12">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/wifi-finder`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-medium shadow-lg hover:shadow-primary-500/25 dark:hover:shadow-primary-400/25 hover:bg-primary-700 dark:hover:bg-primary-600 transition-all"
              >
                <Icons.wifi className="mr-2 h-5 w-5" />
                {t('findCoverageButton')}
              </Link>
              <Link
                href={`/${locale}/coverage-finder`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium shadow-lg transition-all"
              >
                <Icons.map className="mr-2 h-5 w-5" />
                {t('explore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">{t('features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <Icons.signal className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('features.cellular.title')}
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                {t('features.cellular.description')}
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <Icons.wifi className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('features.wifi.title')}
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                {t('features.wifi.description')}
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <Icons.map className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('features.navigation.title')}
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                {t('features.navigation.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-primary-800/10 backdrop-blur-sm" />
            <div className="relative p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                {t('testimonials.title')}
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8 max-w-2xl mx-auto">
                {t('testimonials.subtitle')}
              </p>
              <Link
                href={`/${locale}/auth/signin`}
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-medium shadow-lg hover:shadow-primary-500/25 dark:hover:shadow-primary-400/25 hover:bg-primary-700 dark:hover:bg-primary-600 transition-all group"
              >
                <Icons.chevronRight className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

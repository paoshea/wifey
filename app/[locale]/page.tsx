'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icons } from 'components/ui/icons';
import { Badge } from 'components/ui/badge';
import { useTranslations } from 'next-intl';
import { Logo } from 'components/brand/logo';
import { brandConfig } from 'lib/branding';
import Image from 'next/image';

// Common class combinations for better maintainability
const navLinkClasses = "text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary-400 after:to-primary-500 hover:after:w-full after:transition-all after:duration-300";
const primaryButtonClasses = "px-8 py-3 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white transition-all transform hover:scale-105 shadow-lg hover:shadow-primary/20";
const featureCardClasses = "group p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border hover:border-primary/20 shadow-lg hover:shadow-xl";
const gradientTextClasses = "bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-500";

export default function LocalePage() {
  const { locale } = useParams();
  const t = useTranslations('home');
  const nav = useTranslations('navigation');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-border z-50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/${locale}`} className="flex items-center space-x-2" aria-label="Home">
                <Logo size="sm" />
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </Link>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <Link
                href={`/${locale}/wifi-finder`}
                className={navLinkClasses}
                aria-label={nav('wifi')}
              >
                {nav('wifi')}
              </Link>
              <Link
                href={`/${locale}/coverage-finder`}
                className={navLinkClasses}
                aria-label={nav('coverage')}
              >
                {nav('coverage')}
              </Link>
              <Link
                href={`/${locale}/map`}
                className={navLinkClasses}
                aria-label={nav('home')}
              >
                {nav('home')}
              </Link>
              <Link
                href={`/${locale}/leaderboard`}
                className={navLinkClasses}
                aria-label={nav('leaderboard')}
              >
                {nav('leaderboard')}
              </Link>
              <Link
                href={`/${locale}/auth/signin`}
                className={`ml-4 ${primaryButtonClasses}`}
                aria-label={nav('signIn')}
              >
                {nav('signIn')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:pt-32 sm:pb-24" aria-labelledby="hero-title">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge
              variant="secondary"
              className="text-sm px-4 py-1 bg-gradient-to-r from-primary-400/10 to-primary-500/10 text-primary-500"
            >
              {t('featuringNow.title')}
            </Badge>
          </div>
          <h1 id="hero-title" className={`text-4xl font-bold tracking-tight sm:text-6xl ${gradientTextClasses} mb-6`}>
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/wifi-finder`}
              className={primaryButtonClasses}
              aria-label={t('findCoverageButton')}
            >
              {t('findCoverageButton')}
            </Link>
            <Link
              href={`/${locale}/coverage-finder`}
              className="px-8 py-3 rounded-full bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-all transform hover:scale-105 shadow-lg hover:shadow-secondary/20"
              aria-label={t('explore')}
            >
              {t('explore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-title">
        <div className="text-center mb-12">
          <h2 id="features-title" className={`text-3xl font-bold mb-4 ${gradientTextClasses}`}>
            {t('features.title')}
          </h2>
          <p className="text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.signal className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('features.cellular.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('features.cellular.description')}
            </p>
          </div>

          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.wifi className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('features.wifi.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('features.wifi.description')}
            </p>
          </div>

          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.map className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('features.navigation.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('features.navigation.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="gamification-title">
        <div className="text-center mb-12">
          <h2 id="gamification-title" className={`text-3xl font-bold mb-4 ${gradientTextClasses}`}>
            {t('gamification.title')}
          </h2>
          <p className="text-muted-foreground">{t('gamification.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.trophy className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('gamification.points.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('gamification.points.description')}
            </p>
          </div>

          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.star className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('gamification.badges.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('gamification.badges.description')}
            </p>
          </div>

          <div className={featureCardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <Icons.flame className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-foreground">{t('gamification.leaderboard.title')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('gamification.leaderboard.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="cta-title">
        <div className="bg-gradient-to-r from-primary-400/10 to-primary-500/10 rounded-3xl p-8 sm:p-12 text-center">
          <h2 id="cta-title" className={`text-3xl font-bold mb-4 ${gradientTextClasses}`}>
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className={`inline-block ${primaryButtonClasses}`}
            aria-label={t('getStarted')}
          >
            {t('getStarted')}
          </Link>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Signal, Wifi, Trophy, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FeatureShowcase } from '@/components/sections/FeatureShowcase';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 flex flex-wrap justify-center items-baseline gap-x-4 gap-y-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                Find Coverage
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Anywhere
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 mt-6 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
        </motion.div>

        {/* Features Title Section */}
        <motion.div 
          className="text-center mt-16 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('home.features.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('home.features.subtitle')}
          </p>
        </motion.div>

        {/* Feature Cards */}
        <FeatureShowcase />

        {/* Action Buttons */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Link href={`/${locale}/onboarding`}>
                {t('home.tellUsAboutYourself')}
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="w-full sm:w-auto min-w-[200px] border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600"
            >
              <Link href={`/${locale}/explore`}>
                {t('home.exploreMap')}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Gamification Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('home.gamification.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            {t('home.gamification.subtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-transparent hover:border-blue-500 transition-all duration-300">
              <Trophy className="w-10 h-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.gamification.points.title')}</h3>
              <p className="text-gray-600">{t('home.gamification.points.description')}</p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-transparent hover:border-blue-500 transition-all duration-300">
              <Star className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.gamification.badges.title')}</h3>
              <p className="text-gray-600">{t('home.gamification.badges.description')}</p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-transparent hover:border-blue-500 transition-all duration-300">
              <Award className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.gamification.leaderboard.title')}</h3>
              <p className="text-gray-600">{t('home.gamification.leaderboard.description')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
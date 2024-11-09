'use client';

import { MapPin, Wifi, Signal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function Home() {
  const t = useTranslations('home');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            <span className="block mb-2">{t('title')}</span>
            <span className="block text-blue-600 hover:text-blue-700 transition-colors duration-300">
              {t('subtitle')}
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 md:mt-5 md:max-w-3xl">
            {t('description')}
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Link href="/coverage-finder" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <Signal className="w-4 h-4 mr-2" />
                {t('findCoverageButton')}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
              <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                <Signal className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {t('features.cellular.title')}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                {t('features.cellular.description')}
              </p>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
              <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                <Wifi className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {t('features.wifi.title')}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                {t('features.wifi.description')}
              </p>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
              <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                <MapPin className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {t('features.navigation.title')}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                {t('features.navigation.description')}
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
'use client';

import { MapPin, Wifi, Signal, Star, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FeatureShowcase } from '@/components/sections/FeatureShowcase';

export default function Home() {
  const t = useTranslations();

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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/onboarding">{t('home.getStarted')}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/map">{t('home.exploreMap')}</Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature Showcase Section */}
        <FeatureShowcase />

        <motion.div 
          className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Link href="/coverage-finder">
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
                <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                  <Signal className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {t('home.features.cellular.title')}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                  {t('home.features.cellular.description')}
                </p>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/wifi-finder">
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
                <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                  <Wifi className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {t('home.features.wifi.title')}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                  {t('home.features.wifi.description')}
                </p>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/map">
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-4 sm:p-6 cursor-pointer h-full">
                <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
                  <MapPin className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {t('home.features.navigation.title')}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                  {t('home.features.navigation.description')}
                </p>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.section 
          className="py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.testimonials.title')}</h2>
            <p className="text-gray-600">{t('home.testimonials.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{t(`home.testimonials.quotes.${index}`)}</p>
                <div className="font-medium">{t(`home.testimonials.authors.${index}`)}</div>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section 
          className="py-16 bg-white rounded-lg shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('contact.title')}</h2>
            <p className="text-gray-600">{t('contact.description')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Button variant="outline" size="lg" className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              {t('contact.email')}
            </Button>
            <Button variant="outline" size="lg" className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              {t('contact.phone')}
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
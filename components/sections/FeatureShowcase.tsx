'use client';

import { MapPin, Wifi, Signal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export function FeatureShowcase() {
  const t = useTranslations('home.features');
  const locale = useLocale();

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

  const features = [
    {
      icon: Signal,
      title: 'cellular.title',
      description: 'cellular.description',
      href: '/coverage',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Wifi,
      title: 'wifi.title',
      description: 'wifi.description',
      href: '/wifi',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: MapPin,
      title: 'navigation.title',
      description: 'navigation.description',
      href: '/explore',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <motion.div 
      className="grid gap-8 grid-cols-1 md:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div key={index} variants={item}>
            <Link href={`/${locale}${feature.href}`} className="block h-full transform transition-all duration-300 hover:scale-105">
              <Card className="group hover:shadow-2xl transition-all duration-300 bg-white/50 backdrop-blur-sm rounded-xl p-6 cursor-pointer h-full border-2 border-transparent hover:border-blue-500 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-all duration-300 text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {t(feature.title)}
                  </h3>
                  
                  <p className="mt-2 text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                    {t(feature.description)}
                  </p>
                  
                  <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                    <span className="text-sm font-medium">Learn more</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

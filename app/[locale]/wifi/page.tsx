'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wifi, Shield, Signal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WifiPage() {
  const t = useTranslations('wifi');

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <Wifi className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">{t('map.title')}</h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">{t('map.loading')}</p>
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('nearby.title')}</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Signal className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">WiFi Spot {index}</p>
                        <p className="text-sm text-gray-600">200m away</p>
                      </div>
                    </div>
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                {t('nearby.viewMore')}
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{t('stats.title')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium">{t('stats.hotspots')}</span>
                  <span className="text-blue-600">156</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium">{t('stats.secure')}</span>
                  <span className="text-blue-600">92%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium">{t('stats.speed')}</span>
                  <span className="text-blue-600">50 Mbps</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

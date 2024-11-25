'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSignalMonitor } from '@/hooks/useSignalMonitor';
import type { SignalMeasurement } from '@/lib/types/monitoring';
import { motion } from 'framer-motion';

export default function CoverageFinder() {
  const t = useTranslations('coverage');
  const [measurements, setMeasurements] = useState<SignalMeasurement[]>([]);
  const { error, isMonitoring, startMonitoring, stopMonitoring } = useSignalMonitor({
    onMeasurement: (measurement) => {
      setMeasurements((prev) => [...prev, measurement]);
    },
    interval: 2000, // Update every 2 seconds
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('description')}</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Signal className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">{t('signalStrength')}</h2>
          </div>
          <div className="space-y-4">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className="w-full"
              variant={isMonitoring ? "destructive" : "default"}
            >
              {isMonitoring ? t('stopMonitoring') : t('startMonitoring')}
            </Button>
            {error && (
              <p className="text-red-500 text-sm">{error.message}</p>
            )}
          </div>
        </Card>

        {measurements.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('latestMeasurements')}</h2>
            <div className="space-y-2">
              {measurements.slice(-5).map((measurement, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {new Date(measurement.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-medium">
                    {measurement.signalStrength}dBm
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

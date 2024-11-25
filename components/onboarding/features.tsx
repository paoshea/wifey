import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wifi, MapPin, Navigation2 } from 'lucide-react';

interface FeaturesProps {
  onNext: () => void;
}

export function Features({ onNext }: FeaturesProps) {
  const t = useTranslations('onboarding.features');

  const features = [
    {
      key: 'wifi',
      icon: Wifi,
      benefits: ['speed', 'reliability', 'security', 'updates'],
    },
    {
      key: 'coverage',
      icon: MapPin,
      benefits: ['realtime', 'accuracy', 'predictions', 'alerts'],
    },
    {
      key: 'navigation',
      icon: Navigation2,
      benefits: ['routing', 'offline', 'alternatives', 'eta'],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
        <p className="text-lg text-gray-600">{t('description')}</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {features.map(({ key, icon: Icon, benefits }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-start gap-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-gray-600 mb-4">{t(`${key}.description`)}</p>
                <div className="grid grid-cols-2 gap-3">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                      {t(`${key}.benefits.${benefit}`)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onNext}
          className="bg-primary text-white px-8 py-3 rounded-full text-lg font-medium 
                   shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          {t('continue')}
        </motion.button>
      </div>
    </motion.div>
  );
}

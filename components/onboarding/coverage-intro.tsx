import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Signal, Share2 } from 'lucide-react';

interface CoverageIntroProps {
  onNext: () => void;
}

export function CoverageIntro({ onNext }: CoverageIntroProps) {
  const t = useTranslations('onboarding.coverage.intro');

  const steps = [
    { icon: MapPin, key: 'step1' },
    { icon: Signal, key: 'step2' },
    { icon: Share2, key: 'step3' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <h2 className="text-3xl font-bold mb-4 text-center">{t('title')}</h2>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        {t('description')}
      </p>

      <div className="grid gap-8 mb-8 md:grid-cols-3 max-w-4xl">
        {steps.map(({ icon: Icon, key }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(`${key}.title`)}</h3>
            <p className="text-gray-600 text-center">
              {t(`${key}.description`)}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onNext}
        className="bg-primary text-white px-8 py-3 rounded-full text-lg font-medium 
                 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        {t('tryItOut')}
      </motion.button>
    </motion.div>
  );
}

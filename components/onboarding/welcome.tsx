import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface WelcomeProps {
  onNext: () => void;
}

export function Welcome({ onNext }: WelcomeProps) {
  const t = useTranslations('onboarding.welcome');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="Wifey Logo"
          width={120}
          height={120}
          priority
          className="dark:invert"
        />
      </div>

      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        {t('description')}
      </p>

      <button
        onClick={onNext}
        className="bg-primary text-white px-8 py-3 rounded-full text-lg font-medium 
                 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        {t('getStarted')}
      </button>
    </motion.div>
  );
}

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

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
        <Logo width={120} height={120} className="w-full h-full" />
      </div>

      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        {t('description')}
      </p>

      <Button
        onClick={onNext}
        size="lg"
        className="px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        {t('getStarted')}
      </Button>
    </motion.div>
  );
}

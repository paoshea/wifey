'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideWifi, MapPin, Navigation } from 'lucide-react';

const steps = ['welcome', 'features', 'location', 'language'] as const;
type Step = typeof steps[number];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const handleNext = async () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      // Complete onboarding
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/map');
      }
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission(true);
          handleNext();
        },
        () => {
          setLocationPermission(false);
          handleNext();
        }
      );
    } else {
      setLocationPermission(false);
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h1 className="text-3xl font-bold text-gray-900">{t('welcome.title')}</h1>
              <p className="text-gray-600">{t('welcome.description')}</p>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                {t('welcome.getStarted')}
              </button>
            </motion.div>
          )}

          {currentStep === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">{t('features.title')}</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <LucideWifi className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('features.wifi.title')}</h3>
                    <p className="text-gray-600">{t('features.wifi.description')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('features.coverage.title')}</h3>
                    <p className="text-gray-600">{t('features.coverage.description')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Navigation className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('features.navigation.title')}</h3>
                    <p className="text-gray-600">{t('features.navigation.description')}</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  {t('common.next')}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">{t('location.title')}</h2>
              <p className="text-gray-600">{t('location.description')}</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={requestLocationPermission}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  {t('location.enable')}
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  {t('location.skip')}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'language' && (
            <motion.div
              key="language"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">{t('language.title')}</h2>
              <p className="text-gray-600">{t('language.description')}</p>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    router.push('/en/map');
                  }}
                  className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  English
                </button>
                <button
                  onClick={() => {
                    router.push('/es/map');
                  }}
                  className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Español
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  {t('common.back')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full ${
                steps.indexOf(currentStep) >= index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

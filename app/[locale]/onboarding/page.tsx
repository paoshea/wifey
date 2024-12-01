'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LucideWifi, MapPin, Navigation, Star, Mail, Phone, X, Signal, Share, Check } from 'lucide-react';
import { FeatureShowcase } from '@/components/sections/FeatureShowcase';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import Logo from '@/components/ui/logo';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const OnboardingMap = dynamic(
  () => import('@/components/map/OnboardingMap'),
  { ssr: false }
);

const steps = ['welcome', 'coverage-intro', 'coverage-demo', 'features', 'registration'] as const;
type Step = typeof steps[number];

type FeatureDetails = {
  title: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
};

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Digital Nomad",
    content: "Wifey has been a game-changer for my remote work. I never worry about finding reliable internet connections anymore!",
    rating: 5
  },
  {
    name: "Miguel Rodriguez",
    role: "Travel Blogger",
    content: "Esta aplicación es increíble! Me ayuda a mantenerme conectado mientras viajo por todo el mundo.",
    rating: 5
  },
  {
    name: "David Chen",
    role: "Business Traveler",
    content: "The coverage map feature has saved me countless times during important business calls.",
    rating: 4
  }
];

export default function OnboardingPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    preferredLanguage: locale,
    interests: [] as string[]
  });

  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const featureDetails: Record<string, FeatureDetails> = {
    wifi: {
      title: t('features.wifi.title'),
      description: t('features.wifi.description'),
      benefits: [
        t('features.wifi.benefits.speed'),
        t('features.wifi.benefits.reliability'),
        t('features.wifi.benefits.security'),
        t('features.wifi.benefits.updates')
      ],
      icon: <LucideWifi className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600'
    },
    coverage: {
      title: t('features.coverage.title'),
      description: t('features.coverage.description'),
      benefits: [
        t('features.coverage.benefits.realtime'),
        t('features.coverage.benefits.accuracy'),
        t('features.coverage.benefits.predictions'),
        t('features.coverage.benefits.alerts')
      ],
      icon: <MapPin className="w-8 h-8" />,
      color: 'from-green-500 to-green-600'
    },
    navigation: {
      title: t('features.navigation.title'),
      description: t('features.navigation.description'),
      benefits: [
        t('features.navigation.benefits.routing'),
        t('features.navigation.benefits.offline'),
        t('features.navigation.benefits.alternatives'),
        t('features.navigation.benefits.eta')
      ],
      icon: <Navigation className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600'
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNext = async () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      try {
        const response = await fetch(`/api/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          router.push(`/${locale}/map`);
        } else {
          console.error('Failed to complete onboarding:', await response.text());
        }
      } catch (error) {
        console.error('Error during onboarding completion:', error);
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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration form submission
    console.log('Registration form submitted:', userDetails);
    // Reset form
    setUserDetails({ name: '', email: '', preferredLanguage: locale, interests: [] });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <h1 className="text-5xl font-bold text-gray-900">{t('welcome.title')}</h1>
                <p className="text-xl text-gray-600">{t('welcome.description')}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('welcome.getStarted')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'coverage-intro':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('coverage.intro.title')}</h2>
                  <p className="text-xl text-gray-600">{t('coverage.intro.description')}</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('coverage.intro.step1.title')}</h3>
                      <p className="text-gray-600">{t('coverage.intro.step1.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Signal className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('coverage.intro.step2.title')}</h3>
                      <p className="text-gray-600">{t('coverage.intro.step2.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Share className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('coverage.intro.step3.title')}</h3>
                      <p className="text-gray-600">{t('coverage.intro.step3.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('coverage.intro.tryItOut')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'coverage-demo':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('coverage.demo.title')}</h2>
                  <p className="text-xl text-gray-600">{t('coverage.demo.description')}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    <OnboardingMap onLocationSelect={(lat, lng) => {
                      console.log('Selected location:', lat, lng);
                      // Here you can handle the selected location
                    }} />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('coverage.demo.signalStrength')}
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((strength) => (
                          <button
                            key={strength}
                            className="p-2 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                          >
                            <Signal className={`w-5 h-5 ${strength <= 3 ? 'text-gray-400' : 'text-blue-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('coverage.demo.carrier')}
                      </label>
                      <select className="w-full rounded-lg border border-gray-200 p-2">
                        <option value="">{t('coverage.demo.selectCarrier')}</option>
                        <option value="verizon">Verizon</option>
                        <option value="att">AT&T</option>
                        <option value="tmobile">T-Mobile</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        // Handle coverage spot submission
                        handleNext();
                      }}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('coverage.demo.submit')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
                  <p className="text-xl text-gray-600">{t('features.description')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(featureDetails).map(([key, feature]) => (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${feature.color} mb-4`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('features.continue')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'registration':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('registration.title')}</h2>
                  <p className="text-xl text-gray-600">{t('registration.description')}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <form className="space-y-6" onSubmit={handleRegistration}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('registration.nameLabel')}
                        </label>
                        <input
                          type="text"
                          value={userDetails.name}
                          onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('registration.emailLabel')}
                        </label>
                        <input
                          type="email"
                          value={userDetails.email}
                          onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('registration.interests')}
                        </label>
                        <div className="space-y-2">
                          {['wifi', 'coverage', 'navigation'].map((interest) => (
                            <label key={interest} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={userDetails.interests.includes(interest)}
                                onChange={(e) => {
                                  const newInterests = e.target.checked
                                    ? [...userDetails.interests, interest]
                                    : userDetails.interests.filter(i => i !== interest);
                                  setUserDetails({ ...userDetails, interests: newInterests });
                                }}
                                className="rounded border-gray-300 text-blue-600 mr-2"
                              />
                              {t(`registration.interestOptions.${interest}`)}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('registration.submit')}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Logo width={32} height={32} />
              <span className="font-semibold">Wifey</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/auth/signin`}>
                {t('navigation.signIn')}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/${locale}/auth/signup`}>
                {t('navigation.getStarted')}
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-6"
                >
                  <h1 className="text-5xl font-bold text-gray-900">{t('welcome.title')}</h1>
                  <p className="text-xl text-gray-600">{t('welcome.description')}</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('welcome.getStarted')}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          {currentStep === 'coverage-intro' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('coverage.intro.title')}</h2>
                    <p className="text-xl text-gray-600">{t('coverage.intro.description')}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{t('coverage.intro.step1.title')}</h3>
                        <p className="text-gray-600">{t('coverage.intro.step1.description')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Signal className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{t('coverage.intro.step2.title')}</h3>
                        <p className="text-gray-600">{t('coverage.intro.step2.description')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Share className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{t('coverage.intro.step3.title')}</h3>
                        <p className="text-gray-600">{t('coverage.intro.step3.description')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('coverage.intro.tryItOut')}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          {currentStep === 'coverage-demo' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('coverage.demo.title')}</h2>
                    <p className="text-xl text-gray-600">{t('coverage.demo.description')}</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                      <OnboardingMap onLocationSelect={(lat, lng) => {
                        console.log('Selected location:', lat, lng);
                        // Here you can handle the selected location
                      }} />
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('coverage.demo.signalStrength')}
                        </label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((strength) => (
                            <button
                              key={strength}
                              className="p-2 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                            >
                              <Signal className={`w-5 h-5 ${strength <= 3 ? 'text-gray-400' : 'text-blue-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('coverage.demo.carrier')}
                        </label>
                        <select className="w-full rounded-lg border border-gray-200 p-2">
                          <option value="">{t('coverage.demo.selectCarrier')}</option>
                          <option value="verizon">Verizon</option>
                          <option value="att">AT&T</option>
                          <option value="tmobile">T-Mobile</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          // Handle coverage spot submission
                          handleNext();
                        }}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('coverage.demo.submit')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          {currentStep === 'features' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
                    <p className="text-xl text-gray-600">{t('features.description')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(featureDetails).map(([key, feature]) => (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-xl shadow-lg p-6"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${feature.color} mb-4`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('features.continue')}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          {currentStep === 'registration' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('registration.title')}</h2>
                    <p className="text-xl text-gray-600">{t('registration.description')}</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <form className="space-y-6" onSubmit={handleRegistration}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('registration.nameLabel')}
                          </label>
                          <input
                            type="text"
                            value={userDetails.name}
                            onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('registration.emailLabel')}
                          </label>
                          <input
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('registration.interests')}
                          </label>
                          <div className="space-y-2">
                            {['wifi', 'coverage', 'navigation'].map((interest) => (
                              <label key={interest} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={userDetails.interests.includes(interest)}
                                  onChange={(e) => {
                                    const newInterests = e.target.checked
                                      ? [...userDetails.interests, interest]
                                      : userDetails.interests.filter(i => i !== interest);
                                    setUserDetails({ ...userDetails, interests: newInterests });
                                  }}
                                  className="rounded border-gray-300 text-blue-600 mr-2"
                                />
                                {t(`registration.interestOptions.${interest}`)}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center space-x-4">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('registration.submit')}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

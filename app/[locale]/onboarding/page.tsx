'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LucideWifi, MapPin, Navigation, Star, Mail, Phone, X } from 'lucide-react';
import { FeatureShowcase } from '@/components/sections/FeatureShowcase';

const steps = ['welcome', 'features', 'location', 'language'] as const;
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

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
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
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          router.push('/map');
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form
    setContactForm({ name: '', email: '', message: '' });
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
                    onClick={() => router.push('/map')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('welcome.explore')}
                  </button>
                  <button
                    onClick={() => requestLocationPermission()}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {t('welcome.getStarted')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'features':
        return <FeatureShowcase />;
      case 'location':
        return (
          <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <h2 className="text-4xl font-bold text-center text-gray-900">{t('location.title')}</h2>
                <p className="text-gray-600">{t('location.description')}</p>
                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('location.next')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <h2 className="text-4xl font-bold text-center text-gray-900">{t('language.title')}</h2>
                <p className="text-gray-600">{t('language.description')}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/en/map')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    English
                  </button>
                  <button
                    onClick={() => router.push('/es/map')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Español
                  </button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Feature Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${featureDetails[selectedFeature].color}`}>
                    {featureDetails[selectedFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {featureDetails[selectedFeature].title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-600">
                {featureDetails[selectedFeature].description}
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">{t('features.keyBenefits')}</h4>
                <ul className="space-y-2">
                  {featureDetails[selectedFeature].benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setSelectedFeature(null);
                    router.push('/map');
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2 hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  {t('features.tryNow')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      {renderStep()}

      {/* Testimonials Section */}
      <div ref={testimonialsRef} className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-4xl font-bold text-center text-gray-900">{t('testimonials.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-500 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div ref={contactRef} className="min-h-screen bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-4xl font-bold text-center text-gray-900">{t('contact.title')}</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('contact.email')}</h3>
                    <p className="text-gray-600">support@wifeyapp.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('contact.phone')}</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contact.form.name')}</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contact.form.email')}</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contact.form.message')}</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('contact.form.submit')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 space-y-4">
        {[featuresRef, testimonialsRef, contactRef].map((ref, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(ref)}
            className="w-3 h-3 rounded-full bg-blue-600 opacity-50 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>

      {/* Language Selection */}
      <div className="fixed top-4 right-4 space-x-4">
        <button
          onClick={() => router.push('/en/map')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          EN
        </button>
        <button
          onClick={() => router.push('/es/map')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ES
        </button>
      </div>
    </div>
  );
}

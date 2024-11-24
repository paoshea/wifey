'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LucideWifi, MapPin, Navigation, Star, Mail, Phone } from 'lucide-react';

const steps = ['welcome', 'features', 'location', 'language'] as const;
type Step = typeof steps[number];

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
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNext = async () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
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
                onClick={() => scrollToSection(featuresRef)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('welcome.explore')}
              </button>
              <button
                onClick={handleNext}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                {t('welcome.getStarted')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="min-h-screen bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-4xl font-bold text-center text-gray-900">{t('features.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group relative p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <div className="relative z-10 space-y-4">
                  <div className="bg-blue-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <LucideWifi className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white">{t('features.wifi.title')}</h3>
                  <p className="text-gray-600 group-hover:text-white/90">{t('features.wifi.description')}</p>
                </div>
              </div>

              <div className="group relative p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <div className="relative z-10 space-y-4">
                  <div className="bg-green-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <MapPin className="w-6 h-6 text-green-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white">{t('features.coverage.title')}</h3>
                  <p className="text-gray-600 group-hover:text-white/90">{t('features.coverage.description')}</p>
                </div>
              </div>

              <div className="group relative p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <div className="relative z-10 space-y-4">
                  <div className="bg-purple-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Navigation className="w-6 h-6 text-purple-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white">{t('features.navigation.title')}</h3>
                  <p className="text-gray-600 group-hover:text-white/90">{t('features.navigation.description')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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

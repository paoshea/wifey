'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, Bell, LayoutDashboard, BarChart3, Users, Zap, Star, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CommunityPage() {
  const t = useTranslations('community');

  const features = [
    { 
      icon: Trophy, 
      title: t('features.leaderboard.title'),
      description: t('features.leaderboard.description')
    },
    { 
      icon: Bell, 
      title: t('features.notifications.title'),
      description: t('features.notifications.description')
    },
    { 
      icon: LayoutDashboard, 
      title: t('features.dashboard.title'),
      description: t('features.dashboard.description')
    },
    { 
      icon: BarChart3, 
      title: t('features.analytics.title'),
      description: t('features.analytics.description')
    }
  ];

  const benefits = [
    { icon: Trophy, text: t('benefits.items.0') },
    { icon: Zap, text: t('benefits.items.1') },
    { icon: Users, text: t('benefits.items.2') },
    { icon: Target, text: t('benefits.items.3') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container px-4 mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500">
              {t('cta.join')}
            </Button>
            <Button size="lg" variant="outline">
              {t('cta.explore')}
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {t('benefits.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex flex-col items-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <benefit.icon className="w-8 h-8 text-blue-500 mb-4" />
                <p className="text-gray-700">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

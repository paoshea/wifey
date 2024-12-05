'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Heart, Trophy, Sparkles } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from 'components/ui/avatar';
import { Badge } from 'components/ui/badge';

interface JoinTribeProps {
  onNext: () => void;
}

export function JoinTribe({ onNext }: JoinTribeProps) {
  const t = useTranslations('onboarding.joinTribe');
  const [isHovered, setIsHovered] = useState(false);

  const benefits = [
    {
      icon: Users,
      title: 'Connect',
      description: 'Meet like-minded individuals in your area',
    },
    {
      icon: Heart,
      title: 'Share',
      description: 'Share experiences and support each other',
    },
    {
      icon: Trophy,
      title: 'Achieve',
      description: 'Earn badges and climb the leaderboard',
    },
    {
      icon: Sparkles,
      title: 'Grow',
      description: 'Learn and grow together as a community',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white"
    >
      <div className="max-w-4xl w-full space-y-8">
        {/* Featured Now Star */}
        <div className="relative">
          <motion.div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-yellow-400 text-white px-4 py-1 rounded-full flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Featured Now</span>
            </div>
          </motion.div>

          {/* Main Card */}
          <Card
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative overflow-hidden p-8 border-2 transition-all duration-300 hover:border-blue-500"
          >
            <motion.div
              className="absolute inset-0 bg-blue-500 opacity-0"
              animate={{ opacity: isHovered ? 0.02 : 0 }}
            />

            <div className="text-center space-y-6">
              <motion.h2
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {t('title')}
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 max-w-2xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t('description')}
              </motion.p>
            </div>

            {/* Community Stats */}
            <motion.div
              className="grid grid-cols-3 gap-8 my-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-gray-600">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">1M+</div>
                <div className="text-gray-600">Shared Experiences</div>
              </div>
            </motion.div>

            {/* Benefits Grid */}
            <motion.div
              className="grid md:grid-cols-2 gap-6 my-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-blue-50 transition-colors"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-gray-600">{description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Active Members Preview */}
            <motion.div
              className="flex flex-col items-center space-y-4 my-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex -space-x-4">
                {[...Array(5)].map((_, i) => (
                  <Avatar key={i} className="w-12 h-12 border-2 border-white">
                    <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 1}`} alt={`Member ${i + 1}`} />
                    <AvatarFallback>M{i + 1}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">New York</Badge>
                <Badge variant="secondary">London</Badge>
                <Badge variant="secondary">Tokyo</Badge>
                <Badge variant="secondary">+47 more</Badge>
              </div>
            </motion.div>

            {/* Join Button */}
            <motion.div
              className="text-center mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                onClick={onNext}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
              >
                {t('joinButton')}
              </Button>
              <p className="text-sm text-gray-500 mt-4">{t('joinDisclaimer')}</p>
            </motion.div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

import React from 'react'
import { useTranslations } from 'next-intl'
import { Wifi, Signal, Navigation2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'

const features = [
  {
    icon: Signal,
    titleKey: 'features.cellular.title',
    descriptionKey: 'features.cellular.description',
    benefits: [
      'features.cellular.benefits.deadzone',
      'features.cellular.benefits.coverage',
      'features.cellular.benefits.alerts'
    ]
  },
  {
    icon: Wifi,
    titleKey: 'features.wifi.title',
    descriptionKey: 'features.wifi.description',
    benefits: [
      'features.wifi.benefits.discovery',
      'features.wifi.benefits.security',
      'features.wifi.benefits.updates'
    ]
  },
  {
    icon: Navigation2,
    titleKey: 'features.navigation.title',
    descriptionKey: 'features.navigation.description',
    benefits: [
      'features.navigation.benefits.directions',
      'features.navigation.benefits.offline',
      'features.navigation.benefits.alternatives'
    ]
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function FeatureShowcase() {
  const t = useTranslations('onboarding')

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-gray-600">{t('features.subtitle')}</p>
        </div>

        {/* Feature Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.titleKey} variants={item}>
              <Card variant="feature" className="h-full">
                <CardHeader>
                  <feature.icon className="w-8 h-8 mb-4 text-primary transition-colors duration-200 group-hover:text-primary/80" />
                  <CardTitle className="transition-colors duration-200 group-hover:text-primary">{t(feature.titleKey)}</CardTitle>
                  <CardDescription className="transition-colors duration-200">{t(feature.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefitKey: string, index: number) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 transition-colors duration-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-2 transition-colors duration-200" />
                        {t(benefitKey)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

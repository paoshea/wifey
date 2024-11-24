import React from 'react'
import { useTranslations } from 'next-intl'
import { Wifi, Signal, Navigation2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'

const features = [
  {
    icon: Wifi,
    titleKey: 'features.wifi.title',
    descriptionKey: 'features.wifi.description',
  },
  {
    icon: Signal,
    titleKey: 'features.coverage.title',
    descriptionKey: 'features.coverage.description',
  },
  {
    icon: Navigation2,
    titleKey: 'features.navigation.title',
    descriptionKey: 'features.navigation.description',
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
  const t = useTranslations()

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Menu */}
        <NavigationMenu className="mb-12">
          <NavigationMenuList>
            {features.map((feature) => (
              <NavigationMenuItem key={feature.titleKey}>
                <NavigationMenuTrigger variant="primary">
                  <feature.icon className="w-4 h-4 mr-2" />
                  {t(feature.titleKey)}
                </NavigationMenuTrigger>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

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
                  <feature.icon className="w-8 h-8 mb-4" />
                  <CardTitle>{t(feature.titleKey)}</CardTitle>
                  <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Additional content can be added here */}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

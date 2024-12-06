'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Icons } from 'components/ui/icons';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';

const OnboardingMap = dynamic(
  () => import('components/map/OnboardingMap'),
  { ssr: false }
);

const steps = [
  'welcome',
  'coverage-intro',
  'coverage-demo',
  'features',
  'gamification',
  'registration'
] as const;

type Step = typeof steps[number];

interface OnboardingClientProps {
  locale: string;
}

export default function OnboardingClient({ locale }: OnboardingClientProps) {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
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

    if (isSubmitting) return;

    if (!userDetails.username || !userDetails.email || !userDetails.password || !userDetails.confirmPassword) {
      toast.error(t('registration.errors.requiredFields'));
      return;
    }

    if (userDetails.password !== userDetails.confirmPassword) {
      toast.error(t('registration.errors.passwordMismatch'));
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userDetails.username,
          email: userDetails.email,
          password: userDetails.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('registration.success'));
        // Sign in the user automatically after successful registration
        await signIn('credentials', {
          email: userDetails.email,
          password: userDetails.password,
          redirect: false,
        });
        router.push(`/${locale}/dashboard`);
      } else {
        if (data.details) {
          const errors = data.details.map((error: any) => error.message).join(', ');
          toast.error(errors);
        } else {
          toast.error(data.error || t('registration.errors.generic'));
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t('registration.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: `/${locale}/dashboard` });
    } catch (error) {
      toast.error(t('registration.errors.oauthFailed'));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <Icons.signal className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">{t('welcome.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('welcome.description')}
            </p>
            <Button onClick={handleNext} size="lg">
              {t('common.getStarted')}
            </Button>
          </motion.div>
        );

      case 'coverage-intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <Icons.wifi className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">{t('coverageIntro.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('coverageIntro.description')}
            </p>
            <Button onClick={requestLocationPermission} size="lg">
              {t('coverageIntro.enableLocation')}
            </Button>
          </motion.div>
        );

      case 'coverage-demo':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">{t('coverageDemo.title')}</h2>
              <p className="text-muted-foreground">
                {t('coverageDemo.description')}
              </p>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <OnboardingMap />
            </div>
            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext}>
                {t('common.continue')}
              </Button>
            </div>
          </motion.div>
        );

      case 'features':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold">{t('features.title')}</h2>
              <p className="text-muted-foreground">
                {t('features.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['coverage', 'wifi', 'community', 'rewards'].map((feature) => (
                <Card key={feature}>
                  <CardHeader>
                    <CardTitle>{t(`features.${feature}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t(`features.${feature}.description`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext}>
                {t('common.continue')}
              </Button>
            </div>
          </motion.div>
        );

      case 'gamification':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <Icons.trophy className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-3xl font-bold mt-4">{t('gamification.title')}</h2>
              <p className="text-muted-foreground">
                {t('gamification.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['points', 'achievements', 'leaderboard'].map((feature) => (
                <Card key={feature}>
                  <CardHeader>
                    <CardTitle>{t(`gamification.${feature}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t(`gamification.${feature}.description`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext}>
                {t('common.continue')}
              </Button>
            </div>
          </motion.div>
        );

      case 'registration':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="w-full max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>{t('registration.title')}</CardTitle>
                <CardDescription>
                  {t('registration.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isSubmitting}
                    >
                      <Icons.google className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOAuthSignIn('github')}
                      disabled={isSubmitting}
                    >
                      <Icons.github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('registration.orContinueWith')}
                      </span>
                    </div>
                  </div>
                  <form onSubmit={handleRegistration} className="space-y-4">
                    <div>
                      <Label htmlFor="username">{t('registration.usernameLabel')}</Label>
                      <Input
                        id="username"
                        type="text"
                        value={userDetails.username}
                        onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t('registration.emailLabel')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userDetails.email}
                        onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">{t('registration.passwordLabel')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userDetails.password}
                        onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">
                        {t('registration.confirmPasswordLabel')}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={userDetails.confirmPassword}
                        onChange={(e) => setUserDetails({ ...userDetails, confirmPassword: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        onClick={handleBack}
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          t('registration.submit')
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const OnboardingMap = dynamic(
  () => import('@/components/map/OnboardingMap'),
  { ssr: false }
);

const steps = ['welcome', 'coverage-intro', 'coverage-demo', 'features', 'registration'] as const;
type Step = typeof steps[number];

interface OnboardingClientProps {
  locale: string;
}

export default function OnboardingClient({ locale }: OnboardingClientProps) {
  const t = useTranslations('onboarding');
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
      console.log('Submitting registration with:', userDetails);

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
        router.push(`/${locale}/map`);
      } else {
        if (data.details) {
          // Handle Zod validation errors
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
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      toast.error(t('registration.errors.oauthFailed'));
    }
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
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('welcome.title')}</h2>
                  <p className="text-xl text-gray-600">{t('welcome.description')}</p>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="px-8"
                  >
                    {t('common.getStarted')}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'registration':
        return (
          <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">
                  {t('registration.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('registration.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-6">
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
                <form onSubmit={handleRegistration} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">{t('registration.usernameLabel')}</Label>
                    <Input
                      id="username"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder={t('registration.usernamePlaceholder')}
                      value={userDetails.username}
                      onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
                      disabled={isSubmitting}
                      required
                      minLength={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('registration.emailLabel')}</Label>
                    <Input
                      id="email"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      placeholder="name@example.com"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('registration.passwordLabel')}</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={userDetails.password}
                      onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
                      disabled={isSubmitting}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">{t('registration.confirmPasswordLabel')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={userDetails.confirmPassword}
                      onChange={(e) => setUserDetails({ ...userDetails, confirmPassword: e.target.value })}
                      disabled={isSubmitting}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4">
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
                      {isSubmitting ? t('common.loading') : t('registration.submit')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('error.passwordMismatch'),
        description: t('error.passwordMismatchDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: t('success.signupTitle'),
        description: t('success.signupDesc'),
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: t('error.signupFailed'),
        description: error instanceof Error ? error.message : t('error.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      toast({
        title: t('error.oauthFailed'),
        description: t('error.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {t('signup.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('signup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-6">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
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
                {t('signup.orContinueWith')}
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">{t('signup.username')}</Label>
              <Input
                id="username"
                placeholder={t('signup.usernamePlaceholder')}
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('signup.email')}</Label>
              <Input
                id="email"
                placeholder={t('signup.emailPlaceholder')}
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('signup.password')}</Label>
              <Input
                id="password"
                placeholder={t('signup.passwordPlaceholder')}
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">
                {t('signup.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                placeholder={t('signup.confirmPasswordPlaceholder')}
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('signup.createAccount')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground text-center">
            {t('signup.byClickingAgree')}{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              {t('signup.terms')}
            </Link>{' '}
            {t('signup.and')}{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              {t('signup.privacy')}
            </Link>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            {t('signup.alreadyHaveAccount')}{' '}
            <Link
              href="/auth/signin"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t('signup.signIn')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

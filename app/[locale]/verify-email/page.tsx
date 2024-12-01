'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    setIsVerifying(true);
    setVerificationStatus('loading');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      setVerificationStatus('success');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {t('verifyEmail.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {email 
              ? t('verifyEmail.checkInbox', { email })
              : verificationStatus === 'idle'
                ? t('verifyEmail.description')
                : t(`verifyEmail.${verificationStatus}`)}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-4">
          {verificationStatus === 'loading' && (
            <Icons.spinner className="h-8 w-8 animate-spin" />
          )}

          {verificationStatus === 'success' && (
            <Icons.checkCircle className="h-8 w-8 text-green-500" />
          )}

          {verificationStatus === 'error' && (
            <Icons.xCircle className="h-8 w-8 text-red-500" />
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {verificationStatus === 'success' && (
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                {t('verifyEmail.signIn')}
              </Link>
            </Button>
          )}

          {verificationStatus === 'error' && (
            <Button
              variant="outline"
              onClick={() => verifyEmail(token!)}
              disabled={isVerifying}
              className="w-full"
            >
              {t('verifyEmail.tryAgain')}
            </Button>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {t('verifyEmail.noEmail')}{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              asChild
            >
              <Link href="/auth/signup">
                {t('verifyEmail.signUp')}
              </Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

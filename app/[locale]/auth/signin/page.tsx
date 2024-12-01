'use client';

import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/ui/logo';

export default function SignInPage() {
  const t = useTranslations('auth');
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(true);
      const result = await signIn(provider, {
        redirect: true,
        callbackUrl: `/${locale}/dashboard`,
      });
      
      // This code will only run if redirect: true fails
      if (result?.error) {
        toast({
          title: t('error'),
          description: t('signInError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('signInError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo width={48} height={48} />
          </div>
          <CardTitle className="text-2xl font-bold">{t('signIn')}</CardTitle>
          <CardDescription>
            {t('signInDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            {t('continueWithGoogle')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSignIn('github')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.github className="mr-2 h-4 w-4" />
            )}
            {t('continueWithGithub')}
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            {t('privacyNotice')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

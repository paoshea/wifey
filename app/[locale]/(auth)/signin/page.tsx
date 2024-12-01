'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Auth');
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}/dashboard`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: result.error,
        });
        return;
      }

      // Add locale to the callback URL if it doesn't have one
      const redirectUrl = callbackUrl.startsWith('/') && !callbackUrl.startsWith(`/${locale}`) 
        ? `/${locale}${callbackUrl}` 
        : callbackUrl;

      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('genericError'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('welcomeBack')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('chooseSignInMethod')}
            </p>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => signIn('google', { callbackUrl })}
            >
              <Icons.google className="mr-2 h-4 w-4" />
              {t('continueWithGoogle')}
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => signIn('github', { callbackUrl })}
            >
              <Icons.github className="mr-2 h-4 w-4" />
              {t('continueWithGithub')}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('signIn')}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            {t('noAccount')}{' '}
            <Link
              href={`/${router.locale}/register`}
              className="font-semibold text-primary hover:underline"
            >
              {t('signUp')}
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}

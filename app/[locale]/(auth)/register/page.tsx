'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Signal, Globe2, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('auth.register');

  const formSchema = z.object({
    name: z.string().min(2, {
      message: t('validation.nameRequired'),
    }),
    email: z.string().email({
      message: t('validation.emailInvalid'),
    }),
    password: z.string().min(8, {
      message: t('validation.passwordMinLength'),
    }),
    language: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      language: 'en',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && data.details) {
          const errorMessage = data.details
            .map((err: any) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          throw new Error(errorMessage);
        }
        
        // Handle other errors
        throw new Error(data.error || t('error'));
      }

      // Show success message
      toast({
        title: t('success'),
        description: t('successMessage'),
      });

      // Redirect to welcome page
      router.push(`/${values.language}/welcome`);
    } catch (error) {
      console.error('Registration error:', error);
      
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md space-y-6 sm:space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div 
            className="flex justify-center mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <div className="rounded-full bg-blue-100 p-3">
              <Signal className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        <Input
                          className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        <Input
                          className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        <Input
                          type="password"
                          className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">{t('languageLabel')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="pl-10 relative h-10 sm:h-11 text-sm sm:text-base">
                          <Globe2 className="absolute left-3 top-2.5 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t('languages.en')}</SelectItem>
                        <SelectItem value="es">{t('languages.es')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">Loading...</span>
                  </span>
                ) : (
                  <>
                    {t('submit')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-gray-600">
              {t('alreadyHaveAccount')}{' '}
              <Link
                href="/signin"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('loginLink')}
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
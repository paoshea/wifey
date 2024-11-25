import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface RegistrationProps {
  onNext: () => void;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

type FormData = z.infer<typeof schema>;

export function Registration({ onNext }: RegistrationProps) {
  const t = useTranslations('onboarding.registration');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const interests = [
    { id: 'wifi', label: t('interestOptions.wifi') },
    { id: 'coverage', label: t('interestOptions.coverage') },
    { id: 'navigation', label: t('interestOptions.navigation') },
  ];

  const onSubmit = (data: FormData) => {
    // TODO: Handle form submission
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-600">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('nameLabel')}
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interests')}
            </label>
            <div className="space-y-2">
              {interests.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={id}
                    {...register('interests')}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="ml-3">{label}</span>
                </label>
              ))}
            </div>
            {errors.interests && (
              <p className="mt-1 text-sm text-red-600">
                {errors.interests.message}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onNext}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('skip')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('submit')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

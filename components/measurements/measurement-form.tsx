'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { gamificationService } from '@/lib/services/gamification-service';
import { toast } from 'sonner';

const measurementSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  signalStrength: z.number().min(-120).max(0),
  provider: z.string().min(1),
  networkType: z.enum(['4G', '5G', 'WiFi']),
  isRural: z.boolean().optional(),
  notes: z.string().optional(),
});

type MeasurementFormData = z.infer<typeof measurementSchema>;

export function MeasurementForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
  });

  // Get current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', position.coords.latitude);
          setValue('longitude', position.coords.longitude);
        },
        (error) => {
          toast.error('Error getting location: ' + error.message);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const onSubmit = async (data: MeasurementFormData) => {
    if (!session?.user?.id) {
      toast.error('Please sign in to submit measurements');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit measurement to your API
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit measurement');
      }

      const measurement = await response.json();

      // Process measurement for gamification
      await gamificationService.processMeasurement(measurement, session.user.id);

      // Get updated progress to check for achievements
      const progress = await gamificationService.getUserProgress(session.user.id);
      
      // Check for new achievements (simplified example)
      if (progress?.achievements?.length > 0) {
        const latestAchievement = progress.achievements[0];
        setAchievementData(latestAchievement);
        setShowAchievement(true);
      }

      toast.success('Measurement submitted successfully!');
      router.refresh();
    } catch (error) {
      toast.error('Error submitting measurement: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Submit New Measurement</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="any"
              {...register('latitude', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.latitude && (
              <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="any"
              {...register('longitude', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          className="mt-2 text-sm text-blue-600 hover:text-blue-500"
        >
          Use Current Location
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700">Signal Strength (dBm)</label>
          <input
            type="number"
            {...register('signalStrength', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.signalStrength && (
            <p className="mt-1 text-sm text-red-600">{errors.signalStrength.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Provider</label>
          <input
            type="text"
            {...register('provider')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.provider && (
            <p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Network Type</label>
          <select
            {...register('networkType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="4G">4G</option>
            <option value="5G">5G</option>
            <option value="WiFi">WiFi</option>
          </select>
          {errors.networkType && (
            <p className="mt-1 text-sm text-red-600">{errors.networkType.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isRural')}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">This is a rural area</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            {...register('notes')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Measurement'}
        </button>
      </form>

      <AnimatePresence>
        {showAchievement && achievementData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                🏆
              </div>
              <div>
                <h3 className="text-lg font-medium">New Achievement!</h3>
                <p className="text-sm text-gray-500">{achievementData.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAchievement(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

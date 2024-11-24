'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { measurementSchema, type MeasurementFormData } from '@/lib/validations/measurement';
import { measurementService } from '@/lib/services/measurement-service';
import { performanceMonitor } from '@/lib/services/performance-monitor';

export function MeasurementForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      signalStrength: '',
      networkType: '',
      location: '',
    },
  });

  const onSubmit = async (data: MeasurementFormData) => {
    try {
      setIsSubmitting(true);
      performanceMonitor.startMark('measurement_submit');

      await measurementService.submitMeasurement(data);
      
      form.reset();
      toast.success('Measurement submitted successfully!');
      
      performanceMonitor.endMark('measurement_submit');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit measurement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="signalStrength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Signal Strength (dBm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="-70"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="networkType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network Type</FormLabel>
              <FormControl>
                <Input placeholder="5G" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Latitude, Longitude" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Measurement'}
        </Button>
      </form>
    </Form>
  );
}

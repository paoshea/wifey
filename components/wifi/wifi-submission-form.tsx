'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wifi, Upload, Loader2 } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Card } from 'components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { Textarea } from 'components/ui/textarea';
import { useToast } from 'components/ui/use-toast';
import { wifiSubmissionSchema } from 'lib/validations/wifi';
import { useGamification, GamificationAction } from 'lib/hooks/use-gamification';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function WifiSubmissionForm() {
  const { toast } = useToast();
  const { addPoints } = useGamification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const form = useForm({
    resolver: zodResolver(wifiSubmissionSchema),
    defaultValues: {
      name: '',
      type: 'public',
      speed: '',
      description: '',
    },
  });

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      toast({
        title: 'Location Found',
        description: 'Your current location has been detected',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get your location. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const onSubmit = useCallback(async (data: any) => {
    if (!location) {
      toast({
        title: 'Error',
        description: 'Please get your current location first',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wifi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit WiFi hotspot');
      }

      // Add points for contribution
      await addPoints(GamificationAction.WIFI_SUBMISSION);

      toast({
        title: 'Success',
        description: 'WiFi hotspot submitted successfully! You earned 50 points.',
      });

      // Reset form
      form.reset();
      setLocation(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit WiFi hotspot',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [location, toast, addPoints, form]);

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Wifi className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-semibold">Submit WiFi Hotspot</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotspot Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter hotspot name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="speed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Speed (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Speed in Mbps"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any helpful details..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={getLocation}
              disabled={isSubmitting}
            >
              {location ? (
                'Update Location'
              ) : (
                'Get Current Location'
              )}
            </Button>

            {location && (
              <div className="text-sm text-gray-500">
                Location accuracy: {location.accuracy.toFixed(1)}m
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !location}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Hotspot
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

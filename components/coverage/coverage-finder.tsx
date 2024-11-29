'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Signal, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedMap } from '@/components/map/enhanced-map';
import { coverageSearchSchema } from '@/lib/validations/coverage';
import type { CoverageSearchResult } from '@/lib/types';

interface CoverageFinderProps {
  initialLocation?: { lat: number; lng: number };
}

export function CoverageFinder({ initialLocation }: CoverageFinderProps) {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<CoverageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(coverageSearchSchema),
    defaultValues: {
      location: '',
      radius: '5',
      type: 'all',
    },
  });

  const onSubmit = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/coverage/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to search coverage');
      }

      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: 'No Results Found',
          description: 'Try expanding your search radius or changing location',
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search coverage points',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address or place" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Radius (km)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select radius" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 km</SelectItem>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="20">20 km</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Type</FormLabel>
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
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="cellular">
                          <div className="flex items-center">
                            <Signal className="w-4 h-4 mr-2" />
                            Cellular
                          </div>
                        </SelectItem>
                        <SelectItem value="wifi">
                          <div className="flex items-center">
                            <Wifi className="w-4 h-4 mr-2" />
                            WiFi
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                'Searching...'
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Coverage
                </>
              )}
            </Button>
          </form>
        </Form>
      </Card>

      <div className="h-[600px] rounded-lg overflow-hidden">
        <EnhancedMap
          initialCenter={
            initialLocation
              ? [initialLocation.lat, initialLocation.lng]
              : [10.2, -84.3]
          }
          initialZoom={12}
          searchResults={searchResults}
        />
      </div>
    </div>
  );
}

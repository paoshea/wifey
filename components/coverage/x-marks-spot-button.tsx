'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Signal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoverageStore } from '@/lib/store/coverage-store';

interface XMarksSpotButtonProps {
  onMarkSpot: (location: { lat: number; lng: number }) => void;
  className?: string;
  disabled?: boolean;
}

export default function XMarksSpotButton({ onMarkSpot, className = '', disabled = false }: XMarksSpotButtonProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkSpot = useCallback(async () => {
    setIsMarking(true);
    setError(null);
    setIsAnimating(true);

    try {
      // Get current position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      onMarkSpot(location);
    } catch (err) {
      setError('Could not get location. Please ensure GPS is enabled.');
    } finally {
      setIsMarking(false);
      // Keep animation for a moment after marking
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [onMarkSpot]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="destructive"
          size="lg"
          disabled={disabled || isMarking}
          onClick={handleMarkSpot}
          className={`
            relative overflow-hidden rounded-full w-16 h-16
            bg-gradient-to-br from-red-500 to-red-600
            hover:from-red-600 hover:to-red-700
            shadow-lg hover:shadow-xl
            transition-all duration-300
            ${isAnimating ? 'ring-4 ring-red-400 ring-opacity-50' : ''}
          `}
        >
          <AnimatePresence>
            {isMarking ? (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center justify-center"
              >
                <X className="w-8 h-8 text-white transform rotate-45" />
                <Signal className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-75" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Ripple effect when marking */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

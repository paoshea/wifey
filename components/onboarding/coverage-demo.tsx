import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Signal } from 'lucide-react';

const Map = dynamic(() => import('@/components/map/map-view'), { ssr: false });

interface CoverageDemoProps {
  onNext: () => void;
}

export function CoverageDemo({ onNext }: CoverageDemoProps) {
  const t = useTranslations('onboarding.coverage.demo');
  const [step, setStep] = useState<'map' | 'signal' | 'carrier'>('map');
  const [selectedSignal, setSelectedSignal] = useState<number>(0);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');

  const carriers = ['AT&T', 'T-Mobile', 'Verizon', 'Sprint'];

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setStep('signal');
  };

  const handleSignalSelect = (strength: number) => {
    setSelectedSignal(strength);
    setStep('carrier');
  };

  const handleCarrierSelect = (carrier: string) => {
    setSelectedCarrier(carrier);
    onNext();
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-2xl font-bold text-center">{t('title')}</h2>
      <p className="text-center text-muted-foreground">{t('description')}</p>

      <div className="flex-1 relative">
        <Map onMapClick={handleMapClick} />

        <AnimatePresence>
          {step === 'map' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4">
                <p className="text-lg">{t('tapToMark')}</p>
              </div>
            </motion.div>
          )}

          {step === 'signal' && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-xl shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">{t('signalStrength')}</h3>
              <div className="flex justify-between gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((strength) => (
                  <button
                    key={strength}
                    onClick={() => handleSignalSelect(strength)}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedSignal === strength
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <Signal
                      className={`w-6 h-6 mx-auto ${
                        selectedSignal === strength ? 'text-primary' : 'text-gray-400'
                      }`}
                    />
                    <span className="block text-sm mt-2">{strength}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'carrier' && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-xl shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">{t('carrier')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {carriers.map((carrier) => (
                  <button
                    key={carrier}
                    onClick={() => handleCarrierSelect(carrier)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCarrier === carrier
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {carrier}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

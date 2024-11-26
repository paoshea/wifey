'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Signal, History, TrendingUp, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CoverageData {
  provider: string;
  averageSignalStrength: number;
  technologies: string[];
  reliability: number;
  coverageDensity: number;
  totalPoints: number;
  recentPoints: number;
  strengthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

interface HistoricalData {
  timestamp: string;
  providers: Array<{
    provider: string;
    signalStrength: number;
  }>;
}

export default function CoverageComparison({ location }: { location: { lat: number; lng: number } }) {
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const fetchCoverageComparison = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/coverage/compare?lat=${location.lat}&lng=${location.lng}&radius=5000`);
      if (!response.ok) throw new Error('Failed to fetch coverage comparison');
      const data = await response.json();
      setCoverageData(data.currentCoverage);
      setHistoricalData(data.historicalData);
    } catch (error) {
      console.error('Error fetching coverage comparison:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchCoverageComparison();
  }, [fetchCoverageComparison]);

  const getSignalStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-500';
    if (strength >= 60) return 'text-blue-500';
    if (strength >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription className="flex items-center">
          Loading coverage comparison...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coverageData.map((provider) => (
          <Card 
            key={provider.provider}
            className={`cursor-pointer transition-all duration-200 ${
              selectedProvider === provider.provider ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedProvider(
              selectedProvider === provider.provider ? null : provider.provider
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{provider.provider}</span>
                <Signal 
                  className={`w-6 h-6 ${
                    getSignalStrengthColor(provider.averageSignalStrength)
                  }`}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Average Signal:</span>
                  <span className={getSignalStrengthColor(provider.averageSignalStrength)}>
                    {provider.averageSignalStrength.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reliability:</span>
                  <span>{(provider.reliability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Technologies:</span>
                  <span>{provider.technologies.join(', ')}</span>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Signal Distribution</div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${(provider.strengthDistribution.excellent / provider.totalPoints) * 100}%` }}
                    />
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${(provider.strengthDistribution.good / provider.totalPoints) * 100}%` }}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${(provider.strengthDistribution.fair / provider.totalPoints) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${(provider.strengthDistribution.poor / provider.totalPoints) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Signal Strength History - {selectedProvider}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData
                    .filter(d => d.providers.some(p => p.provider === selectedProvider))
                    .map(d => ({
                      timestamp: new Date(d.timestamp).toLocaleDateString(),
                      signalStrength: d.providers.find(p => p.provider === selectedProvider)?.signalStrength
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="signalStrength"
                    stroke="#8884d8"
                    name="Signal Strength (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

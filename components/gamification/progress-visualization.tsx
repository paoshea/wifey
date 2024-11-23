'use client';

import { motion } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  trend?: number;
}

const StatCard = ({ label, value, icon, trend }: StatCardProps) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      {trend !== undefined && (
        <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 && '+'}
          {trend}%
        </div>
      )}
    </div>
    <div className="mt-2">
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

const LevelProgress = ({ level, progress, nextThreshold }: { 
  level: number; 
  progress: number;
  nextThreshold: number;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold">Level {level}</h3>
        <p className="text-sm text-gray-500">
          {Math.round(progress * 100)}% to Level {level + 1}
        </p>
      </div>
      <div className="text-3xl">
        {level >= 15 ? '🏆' : '⭐️'}
      </div>
    </div>
    
    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute h-full bg-blue-600 rounded-full"
      />
    </div>

    <div className="mt-2 text-sm text-gray-500 text-right">
      {nextThreshold - Math.floor(progress * nextThreshold)} points to next level
    </div>
  </div>
);

const mockActivityData = [
  { date: '2024-01-01', measurements: 12, ruralMeasurements: 8, uniqueLocations: 5 },
  { date: '2024-01-02', measurements: 8, ruralMeasurements: 6, uniqueLocations: 3 },
  { date: '2024-01-03', measurements: 15, ruralMeasurements: 12, uniqueLocations: 7 },
  { date: '2024-01-04', measurements: 10, ruralMeasurements: 7, uniqueLocations: 4 },
  { date: '2024-01-05', measurements: 20, ruralMeasurements: 15, uniqueLocations: 8 },
  { date: '2024-01-06', measurements: 18, ruralMeasurements: 14, uniqueLocations: 6 },
  { date: '2024-01-07', measurements: 25, ruralMeasurements: 20, uniqueLocations: 10 },
];

const ActivityChart = ({ data }: { data: typeof mockActivityData }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-bold mb-4">Activity Overview</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short' })} 
          />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded shadow-lg border">
                    <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                    {payload.map((entry) => (
                      <p key={entry.name} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="measurements" 
            stroke="#3B82F6" 
            name="Total Measurements"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="ruralMeasurements" 
            stroke="#10B981" 
            name="Rural Measurements"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="uniqueLocations" 
            stroke="#8B5CF6" 
            name="Unique Locations"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export function ProgressVisualization({ progress }: { progress: any }) {
  if (!progress) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin text-2xl">🔄</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Measurements',
      value: progress.stats.totalMeasurements,
      icon: '📊',
      trend: progress.stats.measurementsTrend
    },
    {
      label: 'Rural Coverage',
      value: progress.stats.ruralMeasurements,
      icon: '🌲',
      trend: progress.stats.ruralTrend
    },
    {
      label: 'Unique Locations',
      value: progress.stats.uniqueLocations,
      icon: '📍',
      trend: progress.stats.locationsTrend
    },
    {
      label: 'Contribution Score',
      value: progress.stats.contributionScore,
      icon: '⭐️',
      trend: progress.stats.scoreTrend
    }
  ];

  return (
    <div className="space-y-6">
      <LevelProgress 
        level={progress.level} 
        progress={progress.levelProgress} 
        nextThreshold={progress.nextLevelThreshold}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ActivityChart data={progress.activityData || mockActivityData} />

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-4">Milestones</h3>
        <div className="space-y-4">
          {progress.milestones.map((milestone: any) => (
            <div key={milestone.id} className="flex items-center space-x-4">
              <div className={`text-2xl ${milestone.completed ? 'opacity-100' : 'opacity-50'}`}>
                {milestone.icon}
              </div>
              <div className="flex-grow">
                <div className="font-medium">{milestone.title}</div>
                <div className="text-sm text-gray-500">{milestone.description}</div>
              </div>
              <div>
                {milestone.completed ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-sm text-gray-500">
                    {milestone.progress}/{milestone.target}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

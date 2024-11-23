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
  { date: '2024-01-01', measurements: 12 },
  { date: '2024-01-02', measurements: 8 },
  { date: '2024-01-03', measurements: 15 },
  { date: '2024-01-04', measurements: 10 },
  { date: '2024-01-05', measurements: 20 },
  { date: '2024-01-06', measurements: 18 },
  { date: '2024-01-07', measurements: 25 },
];

export function ProgressVisualization() {
  const { userProgress, levelProgress } = useGamification();

  if (!userProgress || !levelProgress) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin text-2xl">🔄</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Measurements',
      value: userProgress.stats.totalMeasurements,
      icon: '📊',
      trend: 12 // Mock trend data
    },
    {
      label: 'Rural Areas Mapped',
      value: userProgress.stats.ruralMeasurements,
      icon: '🌾',
      trend: 25
    },
    {
      label: 'Streak Days',
      value: userProgress.stats.consecutiveDays,
      icon: '🔥',
      trend: 0
    },
    {
      label: 'People Helped',
      value: userProgress.stats.helpfulActions,
      icon: '🤝',
      trend: 8
    }
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <LevelProgress 
        level={userProgress.level}
        progress={levelProgress.progress}
        nextThreshold={levelProgress.nextThreshold}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [value, 'Measurements']}
              />
              <Line
                type="monotone"
                dataKey="measurements"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-4">Achievement Progress</h3>
        <div className="space-y-4">
          {userProgress.achievements.slice(-3).map((achievementId, index) => (
            <div
              key={achievementId}
              className="flex items-center space-x-3 text-sm"
            >
              <div className="text-xl">🏆</div>
              <div className="flex-grow">
                <div className="font-medium">Achievement Unlocked</div>
                <div className="text-gray-500">{achievementId}</div>
              </div>
              <div className="text-gray-400">
                {index === 0 ? 'Just now' : index === 1 ? '2h ago' : '1d ago'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

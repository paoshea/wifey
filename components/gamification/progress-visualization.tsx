'use client';

import { useGamification } from '@/hooks/useGamification';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { StatCard } from './stat-card';
import { LevelProgress } from './level-progress';
import { ActivityChart, type ActivityDataPoint } from './activity-chart';

export interface ProgressData {
  level: number;
  levelProgress: number;
  nextLevelThreshold: number; // Added this field to match the interface
  stats: {
    totalMeasurements: number;
    ruralMeasurements: number;
    uniqueLocations: number;
    contributionScore: number;
    measurementsTrend: number;
    ruralTrend: number;
    locationsTrend: number;
    scoreTrend: number;
  };
  activityData?: ActivityDataPoint[];
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    progress: number;
    target: number;
    icon?: string;
  }>;
}

const mockActivityData: ActivityDataPoint[] = [
  { date: '2024-01-01', measurements: 12, ruralMeasurements: 8, uniqueLocations: 5 },
  { date: '2024-01-02', measurements: 8, ruralMeasurements: 6, uniqueLocations: 3 },
  { date: '2024-01-03', measurements: 15, ruralMeasurements: 12, uniqueLocations: 7 },
  { date: '2024-01-04', measurements: 10, ruralMeasurements: 7, uniqueLocations: 4 },
  { date: '2024-01-05', measurements: 20, ruralMeasurements: 15, uniqueLocations: 8 },
  { date: '2024-01-06', measurements: 18, ruralMeasurements: 14, uniqueLocations: 6 },
  { date: '2024-01-07', measurements: 25, ruralMeasurements: 20, uniqueLocations: 10 },
];

interface ProgressContentProps {
  progress?: ProgressData;
}

const ProgressContent = ({ progress }: ProgressContentProps) => {
  if (!progress) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin text-2xl">🔄</div>
      </div>
    );
  }

  if (!progress.level || !progress.stats) {
    throw new Error('Invalid progress data: Missing required fields');
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

      <div
        className="bg-white p-6 rounded-lg shadow-sm"
        role="region"
        aria-label="Achievement Milestones"
      >
        <h3 className="text-lg font-bold mb-4">Milestones</h3>
        <div className="space-y-4" role="list">
          {progress.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center space-x-4"
              role="listitem"
              aria-label={`${milestone.title} - ${milestone.completed ? 'Completed' : `${milestone.progress} out of ${milestone.target}`}`}
            >
              <div
                className={`text-2xl ${milestone.completed ? 'opacity-100' : 'opacity-50'}`}
                role="img"
                aria-label={`${milestone.title} icon`}
              >
                {milestone.icon || '🎯'}
              </div>
              <div className="flex-grow">
                <div className="font-medium">{milestone.title}</div>
                <div className="text-sm text-gray-500">{milestone.description}</div>
              </div>
              <div>
                {milestone.completed ? (
                  <span
                    className="text-green-600"
                    role="status"
                    aria-label="Milestone completed"
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    className="text-sm text-gray-500"
                    role="status"
                    aria-label={`Progress: ${milestone.progress} out of ${milestone.target}`}
                  >
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
};

export function ProgressVisualization({ progress }: { progress?: ProgressData }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex justify-center items-center h-64 bg-red-50 text-red-800 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-semibold">Unable to display progress</p>
            <p className="text-sm">Please try again later</p>
          </div>
        </div>
      }
    >
      <ProgressContent progress={progress} />
    </ErrorBoundary>
  );
}

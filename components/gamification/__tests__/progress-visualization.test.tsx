import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressVisualization, type ProgressData } from '../progress-visualization';

// Mock child components to verify data flow
jest.mock('../stat-card', () => ({
  StatCard: ({ label, value, icon, trend }: any) => (
    <div data-testid={`stat-card-${label}`} data-value={value} data-trend={trend}>
      {label} - {icon}
    </div>
  ),
}));

jest.mock('../level-progress', () => ({
  LevelProgress: ({ level, progress, nextThreshold }: any) => (
    <div
      data-testid="level-progress"
      data-level={level}
      data-progress={progress}
      data-threshold={nextThreshold}
    >
      Level Progress Component
    </div>
  ),
}));

jest.mock('../activity-chart', () => ({
  ActivityChart: ({ data }: any) => (
    <div
      data-testid="activity-chart"
      data-chart-data={JSON.stringify(data)}
    >
      Activity Chart Component
    </div>
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockProgress: ProgressData = {
  level: 5,
  levelProgress: 0.75,
  nextLevelThreshold: 1000,
  stats: {
    totalMeasurements: 150,
    ruralMeasurements: 75,
    uniqueLocations: 30,
    contributionScore: 450,
    measurementsTrend: 12,
    ruralTrend: 25,
    locationsTrend: 8,
    scoreTrend: 15
  },
  activityData: [
    { date: '2024-01-01', measurements: 10, ruralMeasurements: 5, uniqueLocations: 3 },
    { date: '2024-01-02', measurements: 15, ruralMeasurements: 8, uniqueLocations: 4 },
    { date: '2024-01-03', measurements: 12, ruralMeasurements: 6, uniqueLocations: 5 }
  ],
  milestones: [
    {
      id: '1',
      title: 'Rural Pioneer',
      description: 'Map your first rural area',
      completed: true,
      progress: 1,
      target: 1,
      icon: '🌲'
    },
    {
      id: '2',
      title: 'Coverage Expert',
      description: 'Map 100 locations',
      completed: false,
      progress: 30,
      target: 100,
      icon: '📍'
    }
  ]
};

describe('ProgressVisualization', () => {
  describe('Data Flow', () => {
    it('correctly propagates data to StatCard components', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const totalMeasurementsCard = screen.getByTestId('stat-card-Total Measurements');
      expect(totalMeasurementsCard).toHaveAttribute('data-value', '150');
      expect(totalMeasurementsCard).toHaveAttribute('data-trend', '12');

      const ruralCoverageCard = screen.getByTestId('stat-card-Rural Coverage');
      expect(ruralCoverageCard).toHaveAttribute('data-value', '75');
      expect(ruralCoverageCard).toHaveAttribute('data-trend', '25');
    });

    it('passes correct data to LevelProgress component', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const levelProgress = screen.getByTestId('level-progress');
      expect(levelProgress).toHaveAttribute('data-level', '5');
      expect(levelProgress).toHaveAttribute('data-progress', '0.75');
      expect(levelProgress).toHaveAttribute('data-threshold', '1000');
    });

    it('provides activity data to ActivityChart component', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const activityChart = screen.getByTestId('activity-chart');
      const chartData = JSON.parse(activityChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toEqual(mockProgress.activityData);
    });

    it('uses mock activity data when none provided', () => {
      const progressWithoutActivity = { ...mockProgress, activityData: undefined };
      render(<ProgressVisualization progress={progressWithoutActivity} />);

      const activityChart = screen.getByTestId('activity-chart');
      const chartData = JSON.parse(activityChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(7); // Mock data has 7 days
    });
  });

  describe('State Management', () => {
    it('maintains component state during data updates', () => {
      const { rerender } = render(<ProgressVisualization progress={mockProgress} />);

      const updatedProgress = {
        ...mockProgress,
        stats: {
          ...mockProgress.stats,
          totalMeasurements: 200
        }
      };

      rerender(<ProgressVisualization progress={updatedProgress} />);

      const totalMeasurementsCard = screen.getByTestId('stat-card-Total Measurements');
      expect(totalMeasurementsCard).toHaveAttribute('data-value', '200');
    });

    it('handles loading state gracefully', () => {
      render(<ProgressVisualization />);
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('handles error state through ErrorBoundary', () => {
      const invalidProgress = {
        ...mockProgress,
        level: undefined
      } as any;

      render(<ProgressVisualization progress={invalidProgress} />);
      expect(screen.getByText('Unable to display progress')).toBeInTheDocument();
    });
  });

  describe('Milestone Rendering', () => {
    it('renders milestones with correct completion status', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const completedMilestone = screen.getByLabelText('Rural Pioneer - Completed');
      const inProgressMilestone = screen.getByLabelText('Coverage Expert - 30 out of 100');

      expect(completedMilestone).toBeInTheDocument();
      expect(inProgressMilestone).toBeInTheDocument();
    });

    it('displays milestone progress correctly', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const completedStatus = screen.getByRole('status', { name: 'Milestone completed' });
      const progressStatus = screen.getByRole('status', { name: 'Progress: 30 out of 100' });

      expect(completedStatus).toBeInTheDocument();
      expect(progressStatus).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for milestones', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      expect(screen.getByRole('region', { name: 'Achievement Milestones' })).toBeInTheDocument();
      expect(screen.getByLabelText('Rural Pioneer icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Coverage Expert icon')).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<ProgressVisualization progress={mockProgress} />);

      const heading = screen.getByText('Milestones');
      expect(heading.tagName).toBe('H3');
      expect(heading).toHaveClass('text-lg', 'font-bold');
    });
  });

  describe('Visual Layout', () => {
    it('applies consistent spacing between sections', () => {
      const { container } = render(<ProgressVisualization progress={mockProgress} />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('space-y-6');
    });

    it('maintains responsive grid layout for stat cards', () => {
      const { container } = render(<ProgressVisualization progress={mockProgress} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-4',
        'gap-4'
      );
    });
  });
});

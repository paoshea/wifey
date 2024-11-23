import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressVisualization } from '../progress-visualization';

const mockProgress = {
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
    { date: '2024-01-01', measurements: 10, ruralMeasurements: 5 },
    { date: '2024-01-02', measurements: 15, ruralMeasurements: 8 },
    { date: '2024-01-03', measurements: 12, ruralMeasurements: 6 }
  ],
  milestones: [
    {
      title: 'Rural Pioneer',
      description: 'Map your first rural area',
      completed: true,
      progress: 1,
      target: 1
    },
    {
      title: 'Coverage Expert',
      description: 'Map 100 locations',
      completed: false,
      progress: 30,
      target: 100
    }
  ]
};

describe('ProgressVisualization', () => {
  it('renders all stats cards with correct values', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Measurements
    expect(screen.getByText('75')).toBeInTheDocument(); // Rural Coverage
    expect(screen.getByText('30')).toBeInTheDocument(); // Unique Locations
    expect(screen.getByText('450')).toBeInTheDocument(); // Contribution Score
  });

  it('displays correct level progress', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('75% to Level 6')).toBeInTheDocument();
  });

  it('renders activity chart', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    expect(screen.getByText('Activity Overview')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays milestones with correct completion status', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    const completedMilestone = screen.getByText('Rural Pioneer');
    const incompleteMilestone = screen.getByText('Coverage Expert');
    
    expect(completedMilestone).toBeInTheDocument();
    expect(incompleteMilestone).toBeInTheDocument();
    expect(screen.getByText('30/100')).toBeInTheDocument(); // Progress for Coverage Expert
  });

  it('shows correct trend indicators', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    expect(screen.getByText('+12%')).toBeInTheDocument(); // Measurements trend
    expect(screen.getByText('+25%')).toBeInTheDocument(); // Rural trend
    expect(screen.getByText('+8%')).toBeInTheDocument(); // Locations trend
    expect(screen.getByText('+15%')).toBeInTheDocument(); // Score trend
  });

  it('handles empty progress data gracefully', () => {
    render(<ProgressVisualization progress={undefined} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when progress data is invalid', () => {
    const invalidProgress = { ...mockProgress, level: undefined };
    render(<ProgressVisualization progress={invalidProgress as any} />);
    
    expect(screen.getByText('Error loading progress')).toBeInTheDocument();
  });
});

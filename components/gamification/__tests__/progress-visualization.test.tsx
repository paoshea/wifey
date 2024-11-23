import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    {
      date: '2024-01-01',
      measurements: 12,
      ruralMeasurements: 8,
      uniqueLocations: 5
    },
    // Add more mock data as needed
  ],
  milestones: [
    {
      id: 1,
      title: 'Rural Pioneer',
      description: 'Map your first rural area',
      icon: '🌲',
      completed: true,
      progress: 1,
      target: 1
    },
    {
      id: 2,
      title: 'Coverage Expert',
      description: 'Map 100 unique locations',
      icon: '📍',
      completed: false,
      progress: 30,
      target: 100
    }
  ]
};

describe('ProgressVisualization', () => {
  it('renders loading state when no progress data is provided', () => {
    render(<ProgressVisualization progress={undefined} />);
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });

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
    expect(screen.getByText('250 points to next level')).toBeInTheDocument();
  });

  it('renders activity chart', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    expect(screen.getByText('Activity Overview')).toBeInTheDocument();
    // Note: Testing actual chart rendering would require more complex setup
  });

  it('displays milestones with correct completion status', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    const completedMilestone = screen.getByText('Rural Pioneer');
    const incompleteMilestone = screen.getByText('Coverage Expert');
    
    expect(completedMilestone).toBeInTheDocument();
    expect(incompleteMilestone).toBeInTheDocument();
    expect(screen.getByText('30/100')).toBeInTheDocument();
  });

  it('shows correct trend indicators', () => {
    render(<ProgressVisualization progress={mockProgress} />);
    
    const trends = screen.getAllByText(/\+\d+%/);
    expect(trends).toHaveLength(4); // Should have 4 trend indicators
    expect(trends[0]).toHaveTextContent('+12%'); // Measurements trend
  });
});

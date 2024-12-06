import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressVisualization, type ProgressData } from './progress-visualization';

// Mock child components to simplify testing
jest.mock('./stat-card', () => ({
    StatCard: ({ label, value }: { label: string; value: number }) => (
        <div data-testid="stat-card">
            {label}: {value}
        </div>
    )
}));

jest.mock('./level-progress', () => ({
    LevelProgress: ({ level }: { level: number }) => <div data-testid="level-progress">Level {level}</div>
}));

jest.mock('./activity-chart', () => ({
    ActivityChart: ({ data }: { data: any[] }) => <div data-testid="activity-chart">Chart with {data.length} points</div>
}));

const mockProgressData: ProgressData = {
    level: 5,
    levelProgress: 75,
    nextLevelThreshold: 100,
    stats: {
        totalMeasurements: 100,
        ruralMeasurements: 50,
        uniqueLocations: 25,
        contributionScore: 750,
        measurementsTrend: 10,
        ruralTrend: 5,
        locationsTrend: 3,
        scoreTrend: 15
    },
    milestones: [
        {
            id: '1',
            title: 'First Milestone',
            description: 'Complete your first task',
            completed: true,
            progress: 1,
            target: 1,
            icon: '🎯'
        },
        {
            id: '2',
            title: 'Second Milestone',
            description: 'In progress milestone',
            completed: false,
            progress: 5,
            target: 10,
            icon: '🎮'
        }
    ]
};

describe('ProgressVisualization', () => {
    it('renders loading state when no progress data is provided', () => {
        render(<ProgressVisualization />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('renders error state when progress data is invalid', () => {
        const invalidData = {
            level: 0, // Invalid level
            stats: null // Missing stats
        };

        // @ts-expect-error testing invalid data
        render(<ProgressVisualization progress={invalidData} />);
        expect(screen.getByText('Unable to display progress')).toBeInTheDocument();
    });

    it('renders all components with valid progress data', () => {
        render(<ProgressVisualization progress={mockProgressData} />);

        // Check level progress
        expect(screen.getByTestId('level-progress')).toBeInTheDocument();
        expect(screen.getByText('Level 5')).toBeInTheDocument();

        // Check stats
        const statCards = screen.getAllByTestId('stat-card');
        expect(statCards).toHaveLength(4);
        expect(screen.getByText('Total Measurements: 100')).toBeInTheDocument();
        expect(screen.getByText('Rural Coverage: 50')).toBeInTheDocument();
        expect(screen.getByText('Unique Locations: 25')).toBeInTheDocument();
        expect(screen.getByText('Contribution Score: 750')).toBeInTheDocument();

        // Check activity chart
        expect(screen.getByTestId('activity-chart')).toBeInTheDocument();

        // Check milestones
        expect(screen.getByText('First Milestone')).toBeInTheDocument();
        expect(screen.getByText('Second Milestone')).toBeInTheDocument();
        expect(screen.getByText('Complete your first task')).toBeInTheDocument();
        expect(screen.getByText('In progress milestone')).toBeInTheDocument();
        expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('handles missing activity data by using mock data', () => {
        const dataWithoutActivity = { ...mockProgressData };
        delete dataWithoutActivity.activityData;

        render(<ProgressVisualization progress={dataWithoutActivity} />);
        expect(screen.getByTestId('activity-chart')).toBeInTheDocument();
    });

    it('renders milestone without icon using default', () => {
        const dataWithMissingIcon = {
            ...mockProgressData,
            milestones: [
                {
                    id: '1',
                    title: 'No Icon Milestone',
                    description: 'Milestone without icon',
                    completed: false,
                    progress: 0,
                    target: 1
                }
            ]
        };

        render(<ProgressVisualization progress={dataWithMissingIcon} />);
        expect(screen.getByText('🎯')).toBeInTheDocument(); // Default icon
    });

    it('renders correct milestone progress indicators', () => {
        render(<ProgressVisualization progress={mockProgressData} />);

        // Completed milestone
        expect(screen.getByText('✓')).toBeInTheDocument();

        // In-progress milestone
        expect(screen.getByText('5/10')).toBeInTheDocument();
    });
});

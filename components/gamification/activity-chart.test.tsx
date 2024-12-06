import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityChart, type ActivityDataPoint } from './activity-chart';
import { Tooltip } from 'recharts';

const mockData: ActivityDataPoint[] = [
    {
        date: '2024-01-01',
        measurements: 10,
        ruralMeasurements: 5,
        uniqueLocations: 3
    },
    {
        date: '2024-01-02',
        measurements: 15,
        ruralMeasurements: 8,
        uniqueLocations: 4
    }
];

// Mock ResizeObserver since it's not available in test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock Recharts components to make testing easier
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
        LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Line: () => <div data-testid="chart-line" />,
        CartesianGrid: () => null,
        XAxis: () => null,
        YAxis: () => null,
        Tooltip: ({ content }: { content: any }) => {
            // Expose the tooltip content function for testing
            return (
                <div data-testid="tooltip">
                    {content({
                        active: true,
                        payload: [
                            {
                                name: 'Total Measurements',
                                value: 10,
                                color: '#3B82F6'
                            },
                            {
                                name: 'Rural Measurements',
                                value: 5,
                                color: '#10B981'
                            },
                            {
                                name: 'Unique Locations',
                                value: 3,
                                color: '#8B5CF6'
                            }
                        ],
                        label: '2024-01-01'
                    })}
                </div>
            );
        }
    };
});

describe('ActivityChart', () => {
    it('renders empty state when no data is provided', () => {
        render(<ActivityChart data={[]} />);
        expect(screen.getByText('No activity data available')).toBeInTheDocument();
    });

    it('renders empty state when data is not an array', () => {
        // @ts-expect-error testing invalid input
        render(<ActivityChart data={null} />);
        expect(screen.getByText('No activity data available')).toBeInTheDocument();
    });

    it('renders chart with data', () => {
        render(<ActivityChart data={mockData} />);
        expect(screen.getByText('Activity Overview')).toBeInTheDocument();
    });

    it('renders all three lines in the chart', () => {
        render(<ActivityChart data={mockData} />);
        const lines = screen.getAllByTestId('chart-line');
        expect(lines).toHaveLength(3);
    });

    it('renders tooltip with correct content', () => {
        render(<ActivityChart data={mockData} />);

        const tooltip = screen.getByTestId('tooltip');
        expect(tooltip).toBeInTheDocument();

        // Check tooltip content
        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
        expect(screen.getByText('Total Measurements: 10')).toBeInTheDocument();
        expect(screen.getByText('Rural Measurements: 5')).toBeInTheDocument();
        expect(screen.getByText('Unique Locations: 3')).toBeInTheDocument();
    });

    it('renders tooltip with correct ARIA labels', () => {
        render(<ActivityChart data={mockData} />);

        expect(screen.getByLabelText('Total Measurements: 10')).toBeInTheDocument();
        expect(screen.getByLabelText('Rural Measurements: 5')).toBeInTheDocument();
        expect(screen.getByLabelText('Unique Locations: 3')).toBeInTheDocument();
    });
});

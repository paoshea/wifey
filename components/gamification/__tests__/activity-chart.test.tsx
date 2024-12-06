import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityChart, type ActivityDataPoint } from '../activity-chart';

// Mock recharts components
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => (
        <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children, data, margin, ...props }: any) => (
        <div
            data-testid="line-chart"
            data-chart-data={JSON.stringify(data)}
            data-chart-margin={JSON.stringify(margin)}
            {...props}
        >
            {children}
        </div>
    ),
    Line: ({ dataKey, name, stroke, ...props }: any) => (
        <div
            data-testid={`line-${dataKey}`}
            data-name={name}
            data-stroke={stroke}
            {...props}
        />
    ),
    XAxis: ({ dataKey, tickFormatter, ...props }: any) => (
        <div
            data-testid={`x-axis-${dataKey}`}
            data-tick-formatter={tickFormatter ? 'true' : 'false'}
            {...props}
        />
    ),
    YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
    CartesianGrid: ({ strokeDasharray }: any) => (
        <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
    ),
    Tooltip: ({ content }: any) => {
        // Simulate tooltip content rendering
        const samplePayload = [
            { name: 'Total Measurements', value: 10, color: '#3B82F6' },
            { name: 'Rural Measurements', value: 5, color: '#10B981' },
        ];
        return content({
            active: true,
            payload: samplePayload,
            label: '2024-01-01'
        });
    },
}));

describe('ActivityChart', () => {
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
        },
        {
            date: '2024-01-03',
            measurements: 12,
            ruralMeasurements: 6,
            uniqueLocations: 5
        }
    ];

    describe('data handling', () => {
        it('renders chart with provided data', () => {
            render(<ActivityChart data={mockData} />);

            const chart = screen.getByTestId('line-chart');
            const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');
            expect(chartData).toEqual(mockData);
        });

        it('displays no data message when data is empty', () => {
            render(<ActivityChart data={[]} />);
            expect(screen.getByText('No activity data available')).toBeInTheDocument();
        });

        it('handles invalid data gracefully', () => {
            // @ts-ignore - Testing invalid data
            render(<ActivityChart data={null} />);
            expect(screen.getByText('No activity data available')).toBeInTheDocument();
        });
    });

    describe('chart components', () => {
        it('renders all required chart lines', () => {
            render(<ActivityChart data={mockData} />);

            expect(screen.getByTestId('line-measurements')).toHaveAttribute('data-name', 'Total Measurements');
            expect(screen.getByTestId('line-ruralMeasurements')).toHaveAttribute('data-name', 'Rural Measurements');
            expect(screen.getByTestId('line-uniqueLocations')).toHaveAttribute('data-name', 'Unique Locations');
        });

        it('applies correct colors to lines', () => {
            render(<ActivityChart data={mockData} />);

            expect(screen.getByTestId('line-measurements')).toHaveAttribute('data-stroke', '#3B82F6');
            expect(screen.getByTestId('line-ruralMeasurements')).toHaveAttribute('data-stroke', '#10B981');
            expect(screen.getByTestId('line-uniqueLocations')).toHaveAttribute('data-stroke', '#8B5CF6');
        });

        it('configures axes correctly', () => {
            render(<ActivityChart data={mockData} />);

            expect(screen.getByTestId('x-axis-date')).toHaveAttribute('data-tick-formatter', 'true');
            expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        });

        it('includes grid and tooltip', () => {
            render(<ActivityChart data={mockData} />);

            expect(screen.getByTestId('cartesian-grid')).toHaveAttribute('data-stroke-dasharray', '3 3');
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('provides proper ARIA labels', () => {
            render(<ActivityChart data={mockData} />);

            expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Activity Overview Chart');
            expect(screen.getByTestId('line-chart')).toHaveAttribute('aria-label', 'Activity metrics over time');
        });

        it('includes accessible tooltip content', () => {
            render(<ActivityChart data={mockData} />);

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveAttribute('aria-live', 'polite');
            expect(screen.getByText('Total Measurements: 10')).toBeInTheDocument();
            expect(screen.getByText('Rural Measurements: 5')).toBeInTheDocument();
        });

        it('maintains proper heading hierarchy', () => {
            render(<ActivityChart data={mockData} />);

            const heading = screen.getByText('Activity Overview');
            expect(heading.tagName).toBe('H3');
            expect(heading).toHaveClass('text-lg', 'font-bold');
        });
    });

    describe('visual presentation', () => {
        it('applies consistent spacing and layout', () => {
            const { container } = render(<ActivityChart data={mockData} />);

            const chart = container.firstChild as HTMLElement;
            expect(chart).toHaveClass('p-6', 'rounded-lg', 'shadow-sm');
        });

        it('maintains proper chart dimensions', () => {
            render(<ActivityChart data={mockData} />);

            const chartContainer = screen.getByTestId('responsive-container').parentElement;
            expect(chartContainer).toHaveClass('h-64');
        });

        it('configures proper chart margins', () => {
            render(<ActivityChart data={mockData} />);

            const chart = screen.getByTestId('line-chart');
            const margins = JSON.parse(chart.getAttribute('data-chart-margin') || '{}');
            expect(margins).toEqual({ top: 5, right: 30, left: 20, bottom: 5 });
        });
    });

    describe('data visualization', () => {
        it('handles data point styling', () => {
            render(<ActivityChart data={mockData} />);

            const measurementsLine = screen.getByTestId('line-measurements');
            expect(measurementsLine).toHaveAttribute('dot');
            expect(measurementsLine).toHaveAttribute('activeDot');
        });

        it('configures proper line thickness', () => {
            render(<ActivityChart data={mockData} />);

            const lines = [
                screen.getByTestId('line-measurements'),
                screen.getByTestId('line-ruralMeasurements'),
                screen.getByTestId('line-uniqueLocations')
            ];

            lines.forEach(line => {
                expect(line).toHaveAttribute('strokeWidth', '2');
            });
        });
    });
});

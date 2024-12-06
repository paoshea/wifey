import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProgressVisualization, type ProgressData } from '../progress-visualization';

// Mock window resize events
const resizeWindow = (width: number, height: number) => {
    // @ts-ignore - we need to modify window dimensions
    window.innerWidth = width;
    // @ts-ignore
    window.innerHeight = height;
    fireEvent(window, new Event('resize'));
};

// Create mock intersection observer for visibility tracking
const mockIntersectionObserver = () => {
    const mock = jest.fn();
    mock.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null
    });
    window.IntersectionObserver = mock;
};

// Mock data helper
const createMockProgress = (): ProgressData => ({
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
});

describe('ProgressVisualization User Interaction', () => {
    beforeAll(() => {
        mockIntersectionObserver();
    });

    afterEach(() => {
        // Reset window dimensions
        resizeWindow(1024, 768);
    });

    describe('Responsive Behavior', () => {
        it('adapts layout to mobile screens', () => {
            const { container } = render(<ProgressVisualization progress={createMockProgress()} />);

            // Test mobile layout
            act(() => {
                resizeWindow(375, 667); // iPhone SE dimensions
            });

            const statsGrid = container.querySelector('.grid');
            expect(statsGrid).toHaveClass('grid-cols-1');

            // Verify single column layout
            const statCards = container.querySelectorAll('[data-testid^="stat-card"]');
            const computedStyle = window.getComputedStyle(statCards[0]);
            expect(computedStyle.gridColumnStart).toBe('1');
        });

        it('maintains chart usability on small screens', () => {
            render(<ProgressVisualization progress={createMockProgress()} />);

            act(() => {
                resizeWindow(375, 667);
            });

            const chart = screen.getByTestId('activity-chart');
            expect(chart).toBeInTheDocument();
            expect(chart.parentElement).toHaveClass('h-64'); // Maintains height
        });

        it('adjusts typography for readability', () => {
            const { container } = render(<ProgressVisualization progress={createMockProgress()} />);

            act(() => {
                resizeWindow(375, 667);
            });

            const headings = container.querySelectorAll('h3');
            headings.forEach(heading => {
                const computedStyle = window.getComputedStyle(heading);
                expect(computedStyle.fontSize).toBe('1.125rem'); // text-lg
            });
        });
    });

    describe('Touch Interactions', () => {
        it('handles touch events on chart elements', () => {
            render(<ProgressVisualization progress={createMockProgress()} />);

            const chart = screen.getByTestId('activity-chart');

            // Simulate touch interaction
            fireEvent.touchStart(chart, {
                touches: [{ clientX: 100, clientY: 100 }]
            });

            fireEvent.touchMove(chart, {
                touches: [{ clientX: 150, clientY: 100 }]
            });

            fireEvent.touchEnd(chart);

            // Chart should remain interactive
            expect(chart).toBeInTheDocument();
        });

        it('supports touch navigation through milestones', () => {
            render(<ProgressVisualization progress={createMockProgress()} />);

            const milestones = screen.getAllByRole('listitem');

            milestones.forEach(milestone => {
                fireEvent.touchStart(milestone);
                fireEvent.touchEnd(milestone);

                // Verify milestone remains interactive
                expect(milestone).toHaveAttribute('aria-label');
            });
        });
    });

    describe('Focus Management', () => {
        it('maintains proper focus order', () => {
            render(<ProgressVisualization progress={createMockProgress()} />);

            const focusableElements = screen.getAllByRole('region');

            // Simulate tab navigation
            focusableElements.forEach((element, index) => {
                element.focus();
                expect(document.activeElement).toBe(element);
            });
        });

        it('preserves focus during data updates', () => {
            const { rerender } = render(<ProgressVisualization progress={createMockProgress()} />);

            const milestone = screen.getAllByRole('listitem')[0];
            milestone.focus();
            expect(document.activeElement).toBe(milestone);

            // Update data
            rerender(<ProgressVisualization progress={createMockProgress()} />);

            // Focus should be maintained
            expect(document.activeElement).toBe(milestone);
        });
    });

    describe('High Contrast Mode', () => {
        beforeEach(() => {
            // Mock high contrast mode
            const mediaQuery = jest.fn(() => ({ matches: true }));
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: mediaQuery(),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));
        });

        it('maintains readability in high contrast mode', () => {
            const { container } = render(<ProgressVisualization progress={createMockProgress()} />);

            const statCards = container.querySelectorAll('[data-testid^="stat-card"]');
            statCards.forEach(card => {
                const computedStyle = window.getComputedStyle(card);
                expect(computedStyle.backgroundColor).toBe('rgb(255, 255, 255)'); // white background
            });
        });

        it('ensures sufficient color contrast for trends', () => {
            render(<ProgressVisualization progress={createMockProgress()} />);

            const trends = screen.getAllByText(/%/);
            trends.forEach(trend => {
                const computedStyle = window.getComputedStyle(trend);
                expect(computedStyle.color).toMatch(/(rgb(34, 197, 94)|rgb(239, 68, 68))/); // green-600 or red-600
            });
        });
    });

    describe('Animation Behavior', () => {
        it('respects reduced motion preferences', () => {
            const mediaQuery = jest.fn(() => ({ matches: true }));
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));

            render(<ProgressVisualization progress={createMockProgress()} />);

            const progressBar = screen.getByTestId('progress-bar-animation');
            const computedStyle = window.getComputedStyle(progressBar);
            expect(computedStyle.transition).toBe('none');
        });

        it('maintains smooth transitions on capable devices', () => {
            const mediaQuery = jest.fn(() => ({ matches: false }));
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));

            render(<ProgressVisualization progress={createMockProgress()} />);

            const progressBar = screen.getByTestId('progress-bar-animation');
            expect(progressBar).toHaveAttribute('transition');
        });
    });
});

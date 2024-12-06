import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TestWrapper } from '@lib/test-utils';
import { ProgressVisualization } from '@components/gamification/progress-visualization';
import type { ProgressData } from '@components/gamification/progress-visualization';

// Mock window resize
const resizeWindow = (width: number, height: number) => {
    window.innerWidth = width;
    window.innerHeight = height;
    fireEvent(window, new Event('resize'));
};

const createMockProgress = (overrides = {}): ProgressData => ({
    level: 5,
    levelProgress: 0.75,
    nextLevelThreshold: 1000,
    stats: {
        totalMeasurements: 7500,
        ruralMeasurements: 3000,
        uniqueLocations: 150,
        contributionScore: 450,
        measurementsTrend: 12,
        ruralTrend: 8,
        locationsTrend: 15,
        scoreTrend: 10
    },
    milestones: [
        {
            id: '1',
            title: 'First Steps',
            description: 'Complete your first measurement',
            completed: true,
            progress: 1,
            target: 1,
            icon: '🎯'
        }
    ],
    ...overrides
});

describe('Critical Path: Data Flow', () => {
    it('updates when new progress data is received', async () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        expect(screen.getByText('Level 5')).toBeInTheDocument();

        const updatedProgress = createMockProgress({
            level: 6,
            levelProgress: 0.25
        });

        rerender(
            <TestWrapper>
                <ProgressVisualization progress={updatedProgress} />
            </TestWrapper>
        );

        expect(screen.getByText('Level 6')).toBeInTheDocument();
        expect(screen.getByText('25% to Level 7')).toBeInTheDocument();
    });

    it('maintains state during loading transitions', async () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        const initialValue = screen.getByText('7,500').textContent;

        // Simulate loading state
        rerender(
            <TestWrapper>
                <ProgressVisualization progress={undefined} />
            </TestWrapper>
        );

        // Verify loading state shows spinner
        expect(screen.getByText('🔄')).toBeInTheDocument();

        // Return to loaded state
        rerender(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        expect(screen.getByText('7,500')).toHaveTextContent(initialValue!);
    });

    it('handles data updates without remounting', () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        const progressBar = screen.getByRole('progressbar');
        const initialAnimation = progressBar.getAttribute('animate');

        const updatedProgress = createMockProgress({
            levelProgress: 0.85
        });

        rerender(
            <TestWrapper>
                <ProgressVisualization progress={updatedProgress} />
            </TestWrapper>
        );

        expect(progressBar.getAttribute('animate')).not.toBe(initialAnimation);
    });
});

describe('Critical Path: User Interactions', () => {
    it('maintains responsive layout on resize', () => {
        render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        // Test mobile layout
        act(() => {
            resizeWindow(375, 667);
        });
        const statsContainer = screen.getByRole('region', { name: 'Level Progress' });
        expect(statsContainer).toBeInTheDocument();

        // Test desktop layout
        act(() => {
            resizeWindow(1024, 768);
        });
        expect(statsContainer).toBeInTheDocument();
    });

    it('maintains chart interactivity after updates', async () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        const updatedProgress = createMockProgress({
            stats: {
                totalMeasurements: 8000,
                ruralMeasurements: 3500,
                uniqueLocations: 180,
                contributionScore: 500,
                measurementsTrend: 15,
                ruralTrend: 10,
                locationsTrend: 20,
                scoreTrend: 12
            }
        });

        rerender(
            <TestWrapper>
                <ProgressVisualization progress={updatedProgress} />
            </TestWrapper>
        );

        expect(screen.getByText('8,000')).toBeInTheDocument();
        expect(screen.getByText('+15%')).toBeInTheDocument();
    });
});

describe('Critical Path: Performance', () => {
    it('handles rapid data updates', async () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress({ level: 1, levelProgress: 0.1 })} />
            </TestWrapper>
        );

        // Simulate rapid updates
        for (let i = 0; i < 10; i++) {
            rerender(
                <TestWrapper>
                    <ProgressVisualization
                        progress={createMockProgress({
                            level: i + 1,
                            levelProgress: (i + 1) * 0.1,
                            stats: {
                                totalMeasurements: (i + 1) * 1000,
                                ruralMeasurements: (i + 1) * 400,
                                uniqueLocations: (i + 1) * 20,
                                contributionScore: (i + 1) * 50,
                                measurementsTrend: 5,
                                ruralTrend: 5,
                                locationsTrend: 5,
                                scoreTrend: 5
                            }
                        })}
                    />
                </TestWrapper>
            );
        }

        // Verify final state is correct
        expect(screen.getByText('Level 10')).toBeInTheDocument();
        expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('maintains smooth animations during updates', () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress({ levelProgress: 0.5 })} />
            </TestWrapper>
        );

        const progressBar = screen.getByTestId('progress-bar-animation');
        const initialTransition = progressBar.getAttribute('transition');

        rerender(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress({ levelProgress: 0.75 })} />
            </TestWrapper>
        );

        expect(progressBar.getAttribute('transition')).toBe(initialTransition);
    });
});

describe('Critical Path: Accessibility', () => {
    it('maintains keyboard navigation', () => {
        render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        const elements = screen.getAllByRole('region');
        elements.forEach(element => {
            element.focus();
            expect(document.activeElement).toBe(element);
        });
    });

    it('provides proper ARIA labels throughout component hierarchy', () => {
        render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        expect(screen.getByRole('region', { name: 'Level Progress' })).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
        expect(screen.getByRole('img', { name: 'Star for current level' })).toBeInTheDocument();
    });

    it('maintains focus management during updates', () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        const progressRegion = screen.getByRole('region', { name: 'Level Progress' });
        progressRegion.focus();
        expect(document.activeElement).toBe(progressRegion);

        rerender(
            <TestWrapper>
                <ProgressVisualization
                    progress={createMockProgress({ level: 6 })}
                />
            </TestWrapper>
        );

        expect(document.activeElement).toBe(progressRegion);
    });
});

describe('Critical Path: Error Handling', () => {
    it('recovers from data fetch errors', () => {
        const { rerender } = render(
            <TestWrapper>
                <ProgressVisualization progress={undefined} />
            </TestWrapper>
        );

        // Verify loading state
        expect(screen.getByText('🔄')).toBeInTheDocument();

        // Verify recovery
        rerender(
            <TestWrapper>
                <ProgressVisualization progress={createMockProgress()} />
            </TestWrapper>
        );

        expect(screen.queryByText('🔄')).not.toBeInTheDocument();
        expect(screen.getByText('Level 5')).toBeInTheDocument();
    });

    it('handles malformed progress data gracefully', () => {
        const malformedProgress = {
            level: 'invalid' as unknown as number,
            levelProgress: -1,
            nextLevelThreshold: 0,
            stats: {} as ProgressData['stats'],
            milestones: []
        };

        render(
            <TestWrapper>
                <ProgressVisualization progress={malformedProgress as ProgressData} />
            </TestWrapper>
        );

        expect(screen.getByText('Unable to display progress')).toBeInTheDocument();
    });
});

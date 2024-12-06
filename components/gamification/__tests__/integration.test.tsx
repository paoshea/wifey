import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ProgressVisualization, type ProgressData } from '../progress-visualization';
import { ErrorBoundary } from '@/components/error/error-boundary';

// Create a complete mock of the progress data
const createMockProgress = (overrides = {}): ProgressData => ({
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
    ],
    ...overrides
});

describe('ProgressVisualization Integration', () => {
    describe('Data Flow Integration', () => {
        it('handles real-time data updates', () => {
            const initialProgress = createMockProgress();
            const { rerender } = render(<ProgressVisualization progress={initialProgress} />);

            // Simulate a new measurement being added
            const updatedProgress = createMockProgress({
                stats: {
                    ...initialProgress.stats,
                    totalMeasurements: 151,
                    measurementsTrend: 13
                },
                activityData: [
                    ...initialProgress.activityData!,
                    { date: '2024-01-04', measurements: 1, ruralMeasurements: 0, uniqueLocations: 1 }
                ]
            });

            act(() => {
                rerender(<ProgressVisualization progress={updatedProgress} />);
            });

            // Verify stats updated
            expect(screen.getByText('151')).toBeInTheDocument();
            expect(screen.getByText('+13%')).toBeInTheDocument();
        });

        it('maintains component state during rapid updates', () => {
            const { rerender } = render(<ProgressVisualization progress={createMockProgress()} />);

            // Simulate multiple rapid updates
            for (let i = 0; i < 5; i++) {
                act(() => {
                    rerender(
                        <ProgressVisualization
                            progress={createMockProgress({
                                stats: {
                                    ...createMockProgress().stats,
                                    totalMeasurements: 150 + i
                                }
                            })}
                        />
                    );
                });
            }

            // Verify final state is correct
            expect(screen.getByText('154')).toBeInTheDocument();
        });
    });

    describe('Error Handling Integration', () => {
        it('recovers from temporary data inconsistencies', () => {
            const { rerender } = render(<ProgressVisualization progress={createMockProgress()} />);

            // Simulate temporary invalid data
            const invalidProgress = {
                ...createMockProgress(),
                stats: undefined
            };

            act(() => {
                rerender(<ProgressVisualization progress={invalidProgress as any} />);
            });

            // Verify error state
            expect(screen.getByText('Unable to display progress')).toBeInTheDocument();

            // Simulate recovery
            act(() => {
                rerender(<ProgressVisualization progress={createMockProgress()} />);
            });

            // Verify recovered state
            expect(screen.getByText('150')).toBeInTheDocument();
        });

        it('handles missing activity data gracefully', () => {
            const progressWithoutActivity = createMockProgress({
                activityData: undefined
            });

            render(<ProgressVisualization progress={progressWithoutActivity} />);

            // Should still render with mock data
            expect(screen.getByText('Activity Overview')).toBeInTheDocument();
        });
    });

    describe('Component Integration', () => {
        it('synchronizes milestone progress with stats', () => {
            const progress = createMockProgress({
                stats: {
                    ...createMockProgress().stats,
                    uniqueLocations: 35 // Increased locations
                },
                milestones: [
                    {
                        id: '2',
                        title: 'Coverage Expert',
                        description: 'Map 100 locations',
                        completed: false,
                        progress: 35, // Should match stats
                        target: 100,
                        icon: '📍'
                    }
                ]
            });

            render(<ProgressVisualization progress={progress} />);

            expect(screen.getByText('35')).toBeInTheDocument(); // Stats
            expect(screen.getByText('35/100')).toBeInTheDocument(); // Milestone progress
        });

        it('maintains visual consistency during state changes', () => {
            const { container, rerender } = render(
                <ProgressVisualization progress={createMockProgress()} />
            );

            const initialLayout = container.innerHTML;

            // Simulate minor data update
            act(() => {
                rerender(
                    <ProgressVisualization
                        progress={createMockProgress({
                            stats: {
                                ...createMockProgress().stats,
                                totalMeasurements: 151
                            }
                        })}
                    />
                );
            });

            // Layout structure should remain the same
            expect(container.querySelector('.space-y-6')).toBeInTheDocument();
            expect(container.querySelector('.grid')).toHaveClass(
                'grid-cols-1',
                'md:grid-cols-2',
                'lg:grid-cols-4'
            );
        });
    });

    describe('Performance Critical Paths', () => {
        it('handles large datasets efficiently', () => {
            // Create a large activity dataset
            const largeActivityData = Array.from({ length: 100 }, (_, i) => ({
                date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
                measurements: Math.floor(Math.random() * 100),
                ruralMeasurements: Math.floor(Math.random() * 50),
                uniqueLocations: Math.floor(Math.random() * 20)
            }));

            const largeProgress = createMockProgress({
                activityData: largeActivityData
            });

            render(<ProgressVisualization progress={largeProgress} />);

            // Verify chart renders without crashing
            expect(screen.getByText('Activity Overview')).toBeInTheDocument();
        });

        it('maintains responsiveness during milestone updates', () => {
            const { rerender } = render(<ProgressVisualization progress={createMockProgress()} />);

            // Simulate multiple milestone updates
            for (let i = 0; i < 10; i++) {
                const updatedMilestones = createMockProgress().milestones.map(milestone => ({
                    ...milestone,
                    progress: milestone.progress + 1
                }));

                act(() => {
                    rerender(
                        <ProgressVisualization
                            progress={createMockProgress({
                                milestones: updatedMilestones
                            })}
                        />
                    );
                });
            }

            // Verify final milestone state
            expect(screen.getByText('40/100')).toBeInTheDocument();
        });
    });
});

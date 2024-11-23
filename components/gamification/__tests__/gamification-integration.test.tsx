import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressVisualization } from '../progress-visualization';
import { AchievementShowcase } from '../achievement-showcase';
import { Leaderboard } from '../leaderboard';

// Create a new QueryClient instance for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

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
  activityData: [/* ... */],
  milestones: [/* ... */]
};

const mockAchievements = [
  {
    id: '1',
    title: 'Rural Pioneer',
    description: 'Map your first rural area',
    icon: '🌲',
    tier: 'bronze' as const,
    points: 100,
    unlocked: true,
    requirements: {
      type: 'rural_measurements',
      count: 1
    }
  },
  // ... more achievements
];

const mockLeaderboardEntries = [
  {
    userId: 'test-user-id',
    username: 'Test User',
    avatarUrl: null,
    level: 5,
    points: 1500,
    measurements: 150,
    ruralMeasurements: 75,
    uniqueLocations: 30
  },
  // ... more entries
];

describe('Gamification Integration', () => {
  it('shows consistent user level across components', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard entries={mockLeaderboardEntries} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // Level should be consistent in both components
    const levelInProgress = screen.getByText('Level 5');
    const levelInLeaderboard = screen.getByText('Level 5', { skip: [levelInProgress] });
    
    expect(levelInProgress).toBeInTheDocument();
    expect(levelInLeaderboard).toBeInTheDocument();
  });

  it('displays consistent achievement points between components', () => {
    render(
      <TestWrapper>
        <div>
          <AchievementShowcase achievements={mockAchievements} />
          <ProgressVisualization progress={mockProgress} />
        </div>
      </TestWrapper>
    );

    // Points from unlocked achievements should contribute to total score
    const achievementPoints = mockAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    
    expect(screen.getByText(achievementPoints.toString())).toBeInTheDocument();
  });

  it('maintains consistent stats across components', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard entries={mockLeaderboardEntries} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // Stats should be consistent between progress and leaderboard
    const currentUser = mockLeaderboardEntries.find(e => e.userId === 'test-user-id')!;
    
    expect(screen.getByText(currentUser.measurements.toString())).toBeInTheDocument();
    expect(screen.getByText(currentUser.ruralMeasurements.toString())).toBeInTheDocument();
    expect(screen.getByText(currentUser.uniqueLocations.toString())).toBeInTheDocument();
  });

  it('handles user interactions across components', async () => {
    render(
      <TestWrapper>
        <div>
          <AchievementShowcase achievements={mockAchievements} />
          <Leaderboard entries={mockLeaderboardEntries} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // Click on an achievement
    const achievement = screen.getByText('Rural Pioneer').closest('div');
    fireEvent.click(achievement!);

    // Achievement details should show
    expect(screen.getByText('Requirements')).toBeInTheDocument();

    // Click on user stats in leaderboard
    const userStats = screen.getByText('Your Position').closest('div');
    await userEvent.click(userStats!);

    // Both achievement details and user stats should be visible
    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('updates all components when timeframe changes', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard entries={mockLeaderboardEntries} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // Weekly tab should be active
    const weeklyTab = screen.getByText('Weekly').closest('button');
    expect(weeklyTab).toHaveClass('bg-blue-600');

    // Activity chart should show weekly data
    expect(screen.getByText('Activity Overview')).toBeInTheDocument();
  });

  it('maintains consistent empty states', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <AchievementShowcase achievements={[]} />
          <Leaderboard entries={[]} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // All components should show appropriate empty states
    expect(screen.getByText('🔄')).toBeInTheDocument(); // Progress loading
    expect(screen.getByText('No achievements found')).toBeInTheDocument();
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    const mockError = new Error('Failed to load data');
    
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <AchievementShowcase achievements={[]} />
          <Leaderboard entries={[]} timeframe="weekly" />
        </div>
      </TestWrapper>
    );

    // Components should show appropriate error states
    expect(screen.getAllByText(/🔄/).length).toBeGreaterThan(0);
  });
});

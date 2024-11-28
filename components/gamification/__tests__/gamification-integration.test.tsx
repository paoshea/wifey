import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestWrapper } from '@/lib/test-utils';
import { GamificationService } from '@/lib/services/gamification-service';
import { ProgressVisualization } from '../progress-visualization';
import { AchievementShowcase } from '../achievement-showcase';
import { Leaderboard } from '../leaderboard';
import { 
  LeaderboardEntry, 
  UserProgress,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  AchievementCategory
} from '@/lib/gamification/types';
import { validateUserProgress, validateAchievement } from '@/lib/gamification/validation';

// Mock the GamificationService
jest.mock('@/lib/services/gamification-service', () => ({
  GamificationService: jest.fn().mockImplementation(() => ({
    getLeaderboard: jest.fn().mockResolvedValue([
      {
        userId: '1',
        username: 'TestUser',
        points: 1500,
        level: 5,
        rank: 1,
        topAchievements: [],
        avatarUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  }))
}));

const mockProgress: UserProgress = {
  userId: '1',
  level: 5,
  levelProgress: 0.75,
  currentLevelPoints: 750,
  nextLevelThreshold: 1000,
  totalPoints: 4750,
  stats: {
    [StatsMetric.TOTAL_MEASUREMENTS]: 150,
    [StatsMetric.RURAL_MEASUREMENTS]: 75,
    [StatsMetric.UNIQUE_LOCATIONS]: 30,
    [StatsMetric.CONTRIBUTION_SCORE]: 450,
    [StatsMetric.MEASUREMENTS_TREND]: 12,
    [StatsMetric.RURAL_TREND]: 25,
    [StatsMetric.LOCATIONS_TREND]: 8,
    [StatsMetric.SCORE_TREND]: 15
  },
  activityData: [],
  milestones: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAchievements = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Take measurements in rural areas',
    icon: '🌾',
    points: 100,
    rarity: 'COMMON',
    tier: AchievementTier.BRONZE,
    progress: 5,
    target: 10,
    category: AchievementCategory.RURAL_EXPLORER,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.RURAL_MEASUREMENTS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 10
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'helpful-user',
    title: 'Helpful User',
    description: 'Help other users with their measurements',
    icon: '🤝',
    points: 150,
    rarity: 'RARE',
    tier: AchievementTier.SILVER,
    progress: 3,
    target: 5,
    category: AchievementCategory.COMMUNITY_HELPER,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.HELP_OTHERS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 5
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    userId: '1',
    username: 'TestUser',
    points: 1500,
    level: 5,
    rank: 1,
    topAchievements: mockAchievements,
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Validate mock data
const validateMockData = () => {
  // Validate progress
  const progressValidation = validateUserProgress(mockProgress);
  if (!progressValidation.success) {
    throw new Error(`Invalid mock progress: ${progressValidation.error}`);
  }

  // Validate achievements
  mockAchievements.forEach(achievement => {
    const achievementValidation = validateAchievement(achievement);
    if (!achievementValidation.success) {
      throw new Error(`Invalid mock achievement: ${achievementValidation.error}`);
    }
  });
};

validateMockData();

describe('Gamification Integration', () => {
  it('shows consistent user level across components', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Level should be consistent in both components
    const levelElements = screen.getAllByText('Level 5');
    expect(levelElements).toHaveLength(2);
    expect(levelElements[0]).toBeInTheDocument();
    expect(levelElements[1]).toBeInTheDocument();
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

    // Points from achievements should contribute to total score
    const achievementPoints = mockAchievements
      .reduce((sum, a) => sum + (a.progress >= a.target ? a.points : 0), 0);
    
    expect(screen.getByText(achievementPoints.toString())).toBeInTheDocument();
  });

  it('maintains consistent stats across components', () => {
    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Stats should be consistent between progress and leaderboard
    const levelText = screen.getByText('Level 5');
    const pointsText = screen.getByText('1500 points');

    expect(levelText).toBeInTheDocument();
    expect(pointsText).toBeInTheDocument();
  });

  it('handles user interactions across components', async () => {
    render(
      <TestWrapper>
        <div>
          <AchievementShowcase achievements={mockAchievements} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Check that leaderboard data is loaded
    const username = await screen.findByText('TestUser');
    expect(username).toBeInTheDocument();

    // Verify points are displayed
    const points = screen.getByText('1500 points');
    expect(points).toBeInTheDocument();
  });

  it('shows loading states correctly', () => {
    // Mock service to delay response
    jest.spyOn(GamificationService.prototype, 'getLeaderboard')
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Should show loading states
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error states appropriately', async () => {
    // Mock service to return error
    jest.spyOn(GamificationService.prototype, 'getLeaderboard')
      .mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Should show error state
    const errorMessage = await screen.findByText('Error loading leaderboard');
    expect(errorMessage).toBeInTheDocument();
  });

  it('updates all components when timeframe changes', async () => {
    const mockLeaderboardData = {
      daily: [{
        userId: '1',
        username: 'TestUser',
        points: 1500,
        level: 5,
        rank: 1,
        topAchievements: [],
        avatarUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      weekly: [{
        userId: '1',
        username: 'TestUser',
        points: 5000,
        level: 8,
        rank: 1,
        topAchievements: [],
        avatarUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    };

    // Mock service to return different data for different timeframes
    jest.spyOn(GamificationService.prototype, 'getLeaderboard')
      .mockImplementation((timeframe) => Promise.resolve(mockLeaderboardData[timeframe as keyof typeof mockLeaderboardData]));

    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={mockProgress} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Wait for initial data to load
    await screen.findByText('1500 points');

    // Change timeframe
    const weeklyTab = screen.getByText('Weekly');
    fireEvent.click(weeklyTab);

    // Wait for updated data
    const weeklyPoints = await screen.findByText('5000 points');
    expect(weeklyPoints).toBeInTheDocument();
  });

  it('maintains consistent empty states', async () => {
    // Mock service to return empty data
    jest.spyOn(GamificationService.prototype, 'getLeaderboard')
      .mockResolvedValueOnce([]);

    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <AchievementShowcase achievements={[]} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // All components should show appropriate empty states
    expect(screen.getByText('No progress yet')).toBeInTheDocument();
    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
    const emptyLeaderboard = await screen.findByText('No entries yet');
    expect(emptyLeaderboard).toBeInTheDocument();
  });

  it('handles error states consistently', async () => {
    // Mock service to return error
    jest.spyOn(GamificationService.prototype, 'getLeaderboard')
      .mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <div>
          <ProgressVisualization progress={undefined} />
          <AchievementShowcase achievements={[]} />
          <Leaderboard refreshInterval={0} />
        </div>
      </TestWrapper>
    );

    // Components should show appropriate error states
    expect(screen.getByText('Error loading progress')).toBeInTheDocument();
    expect(screen.getByText('Error loading achievements')).toBeInTheDocument();
    const leaderboardError = await screen.findByText('Error loading leaderboard');
    expect(leaderboardError).toBeInTheDocument();
  });
});

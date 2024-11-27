// components/gamification/__tests__/leaderboard.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';
import { GamificationService } from '../../../lib/gamification/gamification-service';
import {
  LeaderboardEntry,
  Achievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  AchievementCategory
} from '../../../lib/gamification/types';
import { validateAchievement } from '../../../lib/gamification/validation';
import '@testing-library/jest-dom';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick}>{children}</div>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock GamificationService
jest.mock('../../../lib/gamification/gamification-service');

const mockAchievements: Achievement[] = [
  {
    id: 'ach1',
    title: 'First Steps',
    description: 'Made your first contribution',
    icon: 'trophy',
    points: 100,
    rarity: 'COMMON',
    tier: AchievementTier.BRONZE,
    progress: 100,
    target: 100,
    category: AchievementCategory.COVERAGE_PIONEER,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.TOTAL_MEASUREMENTS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 1
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Validate mock achievements
mockAchievements.forEach(achievement => {
  const validationResult = validateAchievement(achievement);
  if (!validationResult.success) {
    throw new Error(`Invalid mock achievement: ${validationResult.error}`);
  }
});

const mockEntries: LeaderboardEntry[] = [
  {
    userId: '1',
    username: 'User 1',
    level: 5,
    points: 1000,
    rank: 1,
    topAchievements: mockAchievements,
    avatarUrl: 'avatar1.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: '2',
    username: 'User 2',
    level: 4,
    points: 900,
    rank: 2,
    topAchievements: [],
    avatarUrl: 'avatar2.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: '3',
    username: 'User 3',
    level: 3,
    points: 800,
    rank: 3,
    topAchievements: [],
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('Leaderboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementation
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockResolvedValue(mockEntries);
  });

  it('renders timeframe tabs correctly', () => {
    render(<Leaderboard />);

    // Check if all timeframe options are present
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('handles timeframe changes correctly', async () => {
    render(<Leaderboard />);

    // Change timeframe to weekly
    const weeklyTab = screen.getByText('Weekly');
    fireEvent.click(weeklyTab);

    // Verify getLeaderboard was called with weekly timeframe
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledWith('weekly');

    // Change timeframe to monthly
    const monthlyTab = screen.getByText('Monthly');
    fireEvent.click(monthlyTab);

    // Verify getLeaderboard was called with monthly timeframe
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledWith('monthly');
  });

  it('displays loading state while fetching data', async () => {
    // Mock a delayed response
    (GamificationService.prototype.getLeaderboard as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockEntries), 100))
    );

    render(<Leaderboard />);

    expect(screen.getByTestId('leaderboard-loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('leaderboard-loading')).not.toBeInTheDocument();
    });
  });

  it('displays error state on fetch failure', async () => {
    // Mock an error response
    (GamificationService.prototype.getLeaderboard as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading leaderboard')).toBeInTheDocument();
    });
  });

  it('displays leaderboard entries correctly', async () => {
    render(<Leaderboard />);

    // Wait for entries to be displayed
    await waitFor(() => {
      mockEntries.forEach(entry => {
        expect(screen.getByText(entry.username)).toBeInTheDocument();
        expect(screen.getByText(`${entry.points} points`)).toBeInTheDocument();
      });
    });
  });

  it('displays achievement badges for top performers', async () => {
    render(<Leaderboard />);

    await waitFor(() => {
      mockEntries[0].topAchievements.forEach(achievement => {
        expect(screen.getByTitle(achievement.title)).toBeInTheDocument();
      });
    });
  });

  it('handles refresh interval correctly', async () => {
    jest.useFakeTimers();

    render(<Leaderboard refreshInterval={1000} />);

    // Initial call
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledTimes(1);

    // Advance timers
    jest.advanceTimersByTime(1000);

    // Should have been called again
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('handles search filtering correctly', async () => {
    render(<Leaderboard />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(mockEntries[0].username)).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: mockEntries[0].username } });

    // Should filter to show only matching entries
    expect(screen.getByText(mockEntries[0].username)).toBeInTheDocument();
    expect(screen.queryByText(mockEntries[1].username)).not.toBeInTheDocument();
  });
});

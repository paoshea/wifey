// components/gamification/__tests__/leaderboard.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';
import { GamificationService } from '@/lib/services/gamification-service';
import {
  ValidatedLeaderboardEntry,
  Achievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  LeaderboardResponse
} from '../../../lib/gamification/types';
import { validateAchievement } from '../../../lib/gamification/validation';
import { PrismaClient } from '@prisma/client';
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

const mockAchievements: Achievement[] = [
  {
    id: 'ach1',
    title: 'First Steps',
    description: 'Made your first contribution',
    icon: 'trophy',
    points: 100,
    tier: AchievementTier.COMMON,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.TOTAL_MEASUREMENTS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 1
    }],
    target: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Validate mock achievements
mockAchievements.forEach(achievement => {
  try {
    validateAchievement(achievement);
  } catch (error) {
    throw new Error(`Invalid mock achievement: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const mockEntries: ValidatedLeaderboardEntry[] = [
  {
    id: '1',
    userId: '1',
    timeframe: 'daily',
    points: 1000,
    rank: 1,
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: '2',
    timeframe: 'daily',
    points: 900,
    rank: 2,
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: '3',
    timeframe: 'daily',
    points: 800,
    rank: 3,
    updatedAt: new Date()
  }
];

// Mock PrismaClient
const mockPrisma = {
  userProgress: {
    findMany: jest.fn().mockResolvedValue([])
  }
} as unknown as PrismaClient;

// Define the extended type for our mock data
type MockLeaderboardEntry = ValidatedLeaderboardEntry & {
  displayName?: string;
  avatarUrl?: string;
  topAchievements: Achievement[];
};

// Mock GamificationService
jest.mock('@/lib/services/gamification-service', () => {
  const mockEntries: MockLeaderboardEntry[] = [
    {
      id: '1',
      userId: 'user1',
      displayName: 'User 1',
      timeframe: 'daily',
      points: 1000,
      rank: 1,
      topAchievements: [],
      avatarUrl: 'avatar1.jpg',
      updatedAt: new Date()
    },
    {
      id: '2',
      userId: 'user2',
      displayName: 'User 2',
      timeframe: 'daily',
      points: 900,
      rank: 2,
      topAchievements: [],
      avatarUrl: 'avatar2.jpg',
      updatedAt: new Date()
    },
    {
      id: '3',
      userId: 'user3',
      displayName: 'User 3',
      timeframe: 'daily',
      points: 800,
      rank: 3,
      topAchievements: [],
      avatarUrl: undefined,
      updatedAt: new Date()
    }
  ];

  const mockService = {
    getLeaderboard: jest.fn().mockResolvedValue(mockEntries)
  };

  return {
    GamificationService: jest.fn().mockImplementation(() => mockService)
  };
});

describe('Leaderboard', () => {
  let mockGamificationService: jest.Mocked<GamificationService>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockGamificationService = new GamificationService(mockPrisma) as jest.Mocked<GamificationService>;
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
    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledWith('weekly');

    // Change timeframe to monthly
    const monthlyTab = screen.getByText('Monthly');
    fireEvent.click(monthlyTab);

    // Verify getLeaderboard was called with monthly timeframe
    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledWith('monthly');
  });

  it('displays loading state while fetching data', async () => {
    // Mock a delayed response
    const delayedMockEntries: LeaderboardResponse = {
      entries: [
        {
          id: '1',
          userId: 'user1',
          username: 'User 1',
          timeframe: 'daily',
          points: 1000,
          rank: 1,
          level: 5,
          streak: {
            current: 7,
            longest: 14
          },
          contributions: 150,
          badges: 10,
          updatedAt: new Date(),
          displayName: 'User 1',
          topAchievements: mockAchievements,
          avatarUrl: 'avatar1.jpg'
        },
        {
          id: '2',
          userId: 'user2',
          username: 'User 2',
          timeframe: 'daily',
          points: 900,
          rank: 2,
          level: 4,
          streak: {
            current: 5,
            longest: 10
          },
          contributions: 120,
          badges: 8,
          updatedAt: new Date(),
          displayName: 'User 2',
          topAchievements: [],
          avatarUrl: 'avatar2.jpg'
        },
        {
          id: '3',
          userId: 'user3',
          username: 'User 3',
          timeframe: 'daily',
          points: 800,
          rank: 3,
          level: 3,
          streak: {
            current: 3,
            longest: 8
          },
          contributions: 90,
          badges: 6,
          updatedAt: new Date(),
          displayName: 'User 3',
          topAchievements: [],
          avatarUrl: undefined
        }
      ],
      pagination: {
        total: 3,
        page: 1,
        pageSize: 10,
        hasMore: false
      }
    };

    mockGamificationService.getLeaderboard.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(delayedMockEntries), 100))
    );

    render(<Leaderboard />);

    expect(screen.getByTestId('leaderboard-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('leaderboard-loading')).not.toBeInTheDocument();
    });
  });

  it('displays error state on fetch failure', async () => {
    // Mock an error response
    mockGamificationService.getLeaderboard.mockRejectedValue(new Error('Failed to fetch'));

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading leaderboard')).toBeInTheDocument();
    });
  });

  it('displays leaderboard entries correctly', async () => {
    render(<Leaderboard />);

    // Wait for entries to be displayed
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('1000 points')).toBeInTheDocument();
    });
  });

  it('displays achievement badges for top performers', async () => {
    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByTitle('User 1')).toBeInTheDocument();
    });
  });

  it('handles refresh interval correctly', async () => {
    jest.useFakeTimers();

    render(<Leaderboard refreshInterval={1000} />);

    // Initial call
    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledTimes(1);

    // Advance timers
    jest.advanceTimersByTime(1000);

    // Should have been called again
    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('handles search filtering correctly', async () => {
    render(<Leaderboard />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    // Should filter to show only matching entries
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 2')).not.toBeInTheDocument();
  });
});

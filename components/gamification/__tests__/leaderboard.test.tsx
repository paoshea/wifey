import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';
import { GamificationService } from '../../../lib/gamification/gamification-service';
import { LeaderboardEntry, Achievement } from '../../../lib/gamification/types';
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
    rarity: 'common',
    progress: 100,
    target: 100,
    completed: true,
    earnedDate: '2023-01-01',
    requirements: {
      type: 'measurements',
      count: 1
    }
  }
];

const mockEntries: LeaderboardEntry[] = [
  {
    userId: '1',
    username: 'User 1',
    level: 5,
    points: 1000,
    rank: 1,
    topAchievements: mockAchievements,
    avatarUrl: 'avatar1.jpg'
  },
  {
    userId: '2',
    username: 'User 2',
    level: 4,
    points: 900,
    rank: 2,
    topAchievements: [],
    avatarUrl: 'avatar2.jpg'
  },
  {
    userId: '3',
    username: 'User 3',
    level: 3,
    points: 800,
    rank: 3,
    topAchievements: [],
    avatarUrl: undefined
  }
];

describe('Leaderboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockResolvedValue({
      entries: mockEntries,
      pagination: {
        total: mockEntries.length,
        page: 1,
        pageSize: 10,
        hasMore: false
      }
    });
  });

  it('renders timeframe tabs correctly', () => {
    render(<Leaderboard timeframe="weekly" />);
    
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('displays user stats correctly', () => {
    render(<Leaderboard timeframe="weekly" />);
    
    const userStatsContainer = screen.getByText('Your Position').closest('div')?.parentElement;
    expect(userStatsContainer).toBeInTheDocument();

    // Check for user stats display
    mockEntries.forEach(entry => {
      expect(screen.getByText(entry.username)).toBeInTheDocument();
      expect(screen.getByText(`Level ${entry.level}`)).toBeInTheDocument();
      expect(screen.getByText(`${entry.points.toLocaleString()} pts`)).toBeInTheDocument();
    });
  });

  it('handles timeframe changes correctly', async () => {
    render(<Leaderboard timeframe="weekly" />);
    
    // Click different timeframe tabs
    const monthlyTab = screen.getByText('This Month');
    await userEvent.click(monthlyTab);
    
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({ timeframe: 'monthly' })
    );
  });

  it('displays loading state while fetching data', async () => {
    // Mock a delayed response
    (GamificationService.prototype.getLeaderboard as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ entries: mockEntries, pagination: { total: 3, page: 1, pageSize: 10, hasMore: false } }), 100))
    );

    render(<Leaderboard timeframe="weekly" />);
    
    expect(screen.getByTestId('leaderboard-loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('leaderboard-loading')).not.toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock an error response
    const errorMessage = 'Failed to fetch leaderboard data';
    (GamificationService.prototype.getLeaderboard as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<Leaderboard timeframe="weekly" />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading leaderboard/i)).toBeInTheDocument();
    });
  });

  it('displays achievement badges correctly', () => {
    render(<Leaderboard timeframe="weekly" />);
    
    const userWithAchievements = mockEntries[0];
    const achievementBadges = screen.getAllByTestId('achievement-badge');
    
    expect(achievementBadges).toHaveLength(userWithAchievements.topAchievements.length);
    userWithAchievements.topAchievements.forEach(achievement => {
      expect(screen.getByTitle(achievement.title)).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const mockPaginatedResponse = {
      entries: mockEntries,
      pagination: {
        total: 10,
        page: 1,
        pageSize: 3,
        hasMore: true
      }
    };

    (GamificationService.prototype.getLeaderboard as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<Leaderboard timeframe="weekly" />);
    
    const loadMoreButton = screen.getByText(/load more/i);
    await userEvent.click(loadMoreButton);

    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('updates automatically at regular intervals', async () => {
    jest.useFakeTimers();

    const refreshInterval = 5000;
    render(<Leaderboard timeframe="weekly" refreshInterval={refreshInterval} />);

    // Fast-forward past the refresh interval
    jest.advanceTimersByTime(refreshInterval + 100);

    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';
import { GamificationService } from '../../../lib/gamification/gamification-service';
import { LeaderboardEntry } from '../../../lib/gamification/types';
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

const mockEntries: LeaderboardEntry[] = [
  {
    id: '1',
    username: 'User 1',
    level: 5,
    points: 1000,
    rank: 1,
    topAchievements: [],
    avatarUrl: 'avatar1.jpg',
    isCurrentUser: true
  },
  {
    id: '2',
    username: 'User 2',
    level: 4,
    points: 900,
    rank: 2,
    topAchievements: [],
    avatarUrl: 'avatar2.jpg'
  },
  {
    id: '3',
    username: 'User 3',
    level: 3,
    points: 800,
    rank: 3,
    topAchievements: [],
    avatarUrl: null
  }
];

describe('Leaderboard', () => {
  const mockLeaderboardData: LeaderboardEntry[] = [
    {
      userId: 'user1',
      username: 'TopContributor',
      points: 1000,
      rank: 1,
      avatar: 'avatar1.jpg'
    },
    {
      userId: 'user2',
      username: 'ActiveMapper',
      points: 750,
      rank: 2,
      avatar: 'avatar2.jpg'
    },
    {
      userId: 'user3',
      username: 'NewExplorer',
      points: 500,
      rank: 3,
      avatar: 'avatar3.jpg'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockResolvedValue(mockLeaderboardData);
  });

  it('renders timeframe tabs correctly', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('displays user stats correctly', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const userStatsContainer = screen.getByText('Your Position').closest('div')?.parentElement;
    expect(userStatsContainer).toBeInTheDocument();
    expect(userStatsContainer?.textContent).toMatch(/Rank #1/);
    expect(userStatsContainer?.textContent).toMatch(/Level 5/);
  });

  it('renders leaderboard entries in correct order', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const usernames = screen.getAllByTestId('username').map(el => el.textContent);
    expect(usernames).toEqual(['User 1', 'User 2', 'User 3']);
  });

  it('highlights current user\'s entry', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    // Find the current user's entry by username
    const currentUserEntry = screen.getByText('User 1')
      .closest('.flex.items-center.p-4');
    expect(currentUserEntry).toHaveClass('bg-blue-50');
  });

  it('displays empty state when no entries exist', () => {
    render(<Leaderboard entries={[]} timeframe="weekly" />);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('handles timeframe changes', () => {
    const handleTimeframeChange = jest.fn();
    
    const { getByText } = render(
      <Leaderboard 
        entries={mockEntries} 
        timeframe="weekly" 
        onTimeframeChange={handleTimeframeChange} 
      />
    );

    const monthlyButton = getByText('This Month');
    fireEvent.click(monthlyButton);

    expect(handleTimeframeChange).toHaveBeenCalledTimes(1);
    expect(handleTimeframeChange).toHaveBeenCalledWith('monthly');
  });

  it('displays avatar images when available', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const avatarImages = screen.getAllByTestId('avatar-image');
    expect(avatarImages).toHaveLength(2); // Two users have avatar URLs
    
    const defaultAvatarContainer = screen.getByTestId('default-avatar');
    expect(defaultAvatarContainer).toBeInTheDocument();
  });

  it('displays rank icons correctly', () => {
    const entriesWithRanks: LeaderboardEntry[] = [
      {
        id: '1',
        username: 'User 1',
        level: 5,
        points: 1000,
        rank: 1,
        topAchievements: [],
        avatarUrl: null
      },
      {
        id: '2',
        username: 'User 2',
        level: 4,
        points: 900,
        rank: 2,
        topAchievements: [],
        avatarUrl: null
      },
      {
        id: '3',
        username: 'User 3',
        level: 3,
        points: 800,
        rank: 3,
        topAchievements: [],
        avatarUrl: null
      },
      {
        id: '4',
        username: 'User 4',
        level: 2,
        points: 700,
        rank: 4,
        topAchievements: [],
        avatarUrl: null
      }
    ];
    
    render(<Leaderboard entries={entriesWithRanks} timeframe="weekly" />);
    
    const rankIcons = screen.getAllByTestId(/^rank-icon/);
    expect(rankIcons).toHaveLength(4);
    expect(rankIcons[0]).toHaveTextContent('👑');
    expect(rankIcons[1]).toHaveTextContent('🥈');
    expect(rankIcons[2]).toHaveTextContent('🥉');
    expect(rankIcons[3]).toHaveTextContent('4');
  });

  it('handles stats expansion toggle correctly', async () => {
    const mockCurrentUser: LeaderboardEntry = {
      id: '1',
      username: 'Test User',
      level: 5,
      points: 1000,
      rank: 1,
      topAchievements: [],
      avatarUrl: null,
      isCurrentUser: true
    };

    render(
      <Leaderboard
        entries={[mockCurrentUser]}
        timeframe="weekly"
      />
    );

    // Initial state - stats panel should be hidden
    const statsToggle = screen.getByTestId('stats-toggle');
    const statsContent = screen.getByTestId('stats-content');
    expect(statsContent).toHaveClass('hidden');

    // Click to expand
    await userEvent.click(statsToggle);

    // Stats panel should now be visible and show points
    expect(statsContent).not.toHaveClass('hidden');
    
    // Find points in the stats panel specifically
    const pointsLabel = screen.getByText('Points');
    const pointsValue = pointsLabel.nextElementSibling;
    expect(pointsValue).toHaveTextContent('1,000');
  });

  it('renders leaderboard with correct data', async () => {
    render(<Leaderboard />);

    // Wait for leaderboard data to load
    await waitFor(() => {
      expect(screen.getByText('TopContributor')).toBeInTheDocument();
    });

    // Check if all users are displayed
    expect(screen.getByText('ActiveMapper')).toBeInTheDocument();
    expect(screen.getByText('NewExplorer')).toBeInTheDocument();

    // Verify points are displayed correctly
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('handles timeframe changes correctly', async () => {
    render(<Leaderboard />);

    // Change timeframe to weekly
    const timeframeSelect = screen.getByRole('combobox');
    fireEvent.change(timeframeSelect, { target: { value: 'weekly' } });

    // Verify getLeaderboard was called with weekly timeframe
    await waitFor(() => {
      expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledWith('weekly');
    });
  });

  it('displays loading state while fetching data', async () => {
    // Delay the mock response
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockLeaderboardData), 100))
    );

    render(<Leaderboard />);

    // Check for loading indicator
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('handles empty leaderboard gracefully', async () => {
    // Mock empty leaderboard response
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockResolvedValue([]);

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('No entries found')).toBeInTheDocument();
    });
  });

  it('handles error state appropriately', async () => {
    // Mock error response
    (GamificationService as jest.MockedClass<typeof GamificationService>).prototype.getLeaderboard.mockRejectedValue(
      new Error('Failed to fetch leaderboard')
    );

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading leaderboard')).toBeInTheDocument();
    });
  });

  it('displays correct rank badges', async () => {
    render(<Leaderboard />);

    await waitFor(() => {
      // Check for rank badges/indicators
      const firstPlace = screen.getByTestId('rank-badge-1');
      const secondPlace = screen.getByTestId('rank-badge-2');
      const thirdPlace = screen.getByTestId('rank-badge-3');

      expect(firstPlace).toHaveClass('gold');
      expect(secondPlace).toHaveClass('silver');
      expect(thirdPlace).toHaveClass('bronze');
    });
  });

  it('allows filtering by username', async () => {
    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('TopContributor')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'Active' } });

    // Only ActiveMapper should be visible
    expect(screen.queryByText('TopContributor')).not.toBeInTheDocument();
    expect(screen.getByText('ActiveMapper')).toBeInTheDocument();
    expect(screen.queryByText('NewExplorer')).not.toBeInTheDocument();
  });

  it('updates automatically at regular intervals', async () => {
    jest.useFakeTimers();

    render(<Leaderboard refreshInterval={5000} />);

    await waitFor(() => {
      expect(screen.getByText('TopContributor')).toBeInTheDocument();
    });

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);

    // Verify getLeaderboard was called again
    expect(GamificationService.prototype.getLeaderboard).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});

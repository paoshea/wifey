import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';

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
});

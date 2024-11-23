import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';

const mockEntries = [
  {
    userId: 'test-user-id', // Matches the mocked session user ID
    username: 'Test User',
    avatarUrl: null,
    level: 5,
    points: 1500,
    measurements: 150,
    ruralMeasurements: 75,
    uniqueLocations: 30
  },
  {
    userId: 'user2',
    username: 'Rural Explorer',
    avatarUrl: 'https://example.com/avatar2.jpg',
    level: 7,
    points: 2500,
    measurements: 250,
    ruralMeasurements: 150,
    uniqueLocations: 50
  },
  {
    userId: 'user3',
    username: 'Coverage Master',
    avatarUrl: 'https://example.com/avatar3.jpg',
    level: 3,
    points: 800,
    measurements: 80,
    ruralMeasurements: 30,
    uniqueLocations: 20
  }
];

describe('Leaderboard', () => {
  it('renders timeframe tabs correctly', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('highlights current timeframe tab', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const weeklyTab = screen.getByText('Weekly').closest('button');
    expect(weeklyTab).toHaveClass('bg-blue-600 text-white');
  });

  it('displays current user stats section', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('Your Position')).toBeInTheDocument();
    expect(screen.getByText('Rank #2')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('expands and collapses user stats on click', async () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const userStatsSection = screen.getByText('Your Position').closest('div');
    await userEvent.click(userStatsSection!);
    
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    
    await userEvent.click(userStatsSection!);
    expect(screen.queryByText('Points')).not.toBeInTheDocument();
  });

  it('renders leaderboard entries in correct order', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const usernames = screen.getAllByRole('heading').map(h => h.textContent);
    expect(usernames).toEqual(['Rural Explorer', 'Test User', 'Coverage Master']);
  });

  it('shows correct rank indicators', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('👑')).toBeInTheDocument(); // 1st place
    expect(screen.getByText('🥈')).toBeInTheDocument(); // 2nd place
    expect(screen.getByText('🥉')).toBeInTheDocument(); // 3rd place
  });

  it('highlights current user\'s entry', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const currentUserEntry = screen.getByText('Test User').closest('div');
    expect(currentUserEntry).toHaveClass('bg-blue-50');
  });

  it('displays empty state when no entries exist', () => {
    render(<Leaderboard entries={[]} timeframe="weekly" />);
    
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to make it to the leaderboard!')).toBeInTheDocument();
  });

  it('shows load more button when appropriate', () => {
    const manyEntries = Array(10).fill(null).map((_, i) => ({
      ...mockEntries[0],
      userId: `user${i}`,
      username: `User ${i}`,
      points: 1000 - i * 100
    }));

    render(<Leaderboard entries={manyEntries} timeframe="weekly" />);
    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('formats numbers correctly in leaderboard entries', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  it('displays avatar images when available', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const avatarImages = screen.getAllByRole('img');
    expect(avatarImages).toHaveLength(2); // Two users have avatar URLs
    
    const defaultAvatar = screen.getByText('👤');
    expect(defaultAvatar).toBeInTheDocument(); // One user has no avatar
  });
});

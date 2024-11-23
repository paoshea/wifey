import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockEntries = [
  {
    id: '1',
    username: 'Test User',
    level: 5,
    points: 1500,
    rank: 1,
    isCurrentUser: true,
    avatar: null
  },
  {
    id: '2',
    username: 'Rural Explorer',
    level: 7,
    points: 2500,
    rank: 2,
    avatar: 'https://example.com/avatar2.jpg'
  },
  {
    id: '3',
    username: 'Coverage Master',
    level: 3,
    points: 800,
    rank: 3,
    avatar: 'https://example.com/avatar3.jpg'
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
    expect(usernames).toEqual(['Test User', 'Rural Explorer', 'Coverage Master']);
  });

  it('highlights current user\'s entry', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    // Find the current user's entry by username
    const currentUserEntry = screen.getByText('Test User')
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
    
    const avatarImages = screen.getAllByRole('img');
    expect(avatarImages).toHaveLength(2); // Two users have avatar URLs
    
    const defaultAvatarContainer = screen.getByTestId('default-avatar');
    expect(defaultAvatarContainer).toBeInTheDocument(); // One user has no avatar
  });
});

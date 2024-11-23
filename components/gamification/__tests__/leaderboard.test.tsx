import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Leaderboard } from '../leaderboard';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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
    
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('displays user stats correctly', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    expect(screen.getByText('Your Position')).toBeInTheDocument();
    expect(screen.getByText(/Rank #1/)).toBeInTheDocument();
    expect(screen.getByText(/Level 5/)).toBeInTheDocument();
  });

  it('renders leaderboard entries in correct order', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const usernames = screen.getAllByTestId('username').map(el => el.textContent);
    expect(usernames).toEqual(['Test User', 'Rural Explorer', 'Coverage Master']);
  });

  it('highlights current user\'s entry', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const currentUserEntry = screen.getByTestId('leaderboard-entry-1');
    expect(currentUserEntry.className).toContain('bg-blue-50');
  });

  it('displays empty state when no entries exist', () => {
    render(<Leaderboard entries={[]} timeframe="weekly" />);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('handles timeframe changes', async () => {
    const onTimeframeChange = jest.fn();
    render(
      <Leaderboard 
        entries={mockEntries} 
        timeframe="weekly" 
        onTimeframeChange={onTimeframeChange} 
      />
    );
    
    await userEvent.click(screen.getByText('Monthly'));
    expect(onTimeframeChange).toHaveBeenCalledWith('monthly');
  });

  it('displays avatar images when available', () => {
    render(<Leaderboard entries={mockEntries} timeframe="weekly" />);
    
    const avatarImages = screen.getAllByRole('img');
    expect(avatarImages).toHaveLength(2); // Two users have avatar URLs
    
    const defaultAvatarContainer = screen.getByTestId('default-avatar');
    expect(defaultAvatarContainer).toBeInTheDocument(); // One user has no avatar
  });
});

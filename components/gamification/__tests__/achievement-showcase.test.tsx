import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementShowcase } from '../achievement-showcase';

const mockAchievements = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    earnedDate: '2024-01-01',
    rarity: 'common' as const,
    progress: 1,
    target: 1,
    completed: true,
    points: 100
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    rarity: 'rare' as const,
    progress: 750,
    target: 1000,
    completed: false,
    points: 500
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    earnedDate: '2024-01-15',
    rarity: 'epic' as const,
    progress: 50,
    target: 50,
    completed: true,
    points: 250
  }
];

describe('AchievementShowcase', () => {
  it('renders loading state when achievements are undefined', () => {
    render(<AchievementShowcase achievements={undefined} />);
    expect(screen.getByText('Loading achievements...')).toBeInTheDocument();
  });

  it('renders empty state when no achievements are available', () => {
    render(<AchievementShowcase achievements={[]} />);
    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
  });

  it('renders all achievements with correct information', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Check titles
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.getByText('Coverage Master')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Complete your first rural area measurement')).toBeInTheDocument();
    expect(screen.getByText('Map 1000 unique locations')).toBeInTheDocument();
    expect(screen.getByText('Complete 50 measurements in one day')).toBeInTheDocument();

    // Check points
    expect(screen.getByText('100 points')).toBeInTheDocument();
    expect(screen.getByText('500 points')).toBeInTheDocument();
    expect(screen.getByText('250 points')).toBeInTheDocument();
  });

  it('displays progress for incomplete achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Coverage Master is incomplete
    expect(screen.getByText('Progress: 750/1000 (75%)')).toBeInTheDocument();
  });

  it('displays earned date for completed achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    expect(screen.getByText('Earned: Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Earned: Jan 15, 2024')).toBeInTheDocument();
  });

  it('applies correct rarity classes to achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const items = screen.getAllByTestId('achievement-item');
    expect(items[0]).toHaveClass('achievement-epic'); // Speed Demon
    expect(items[1]).toHaveClass('achievement-rare'); // Coverage Master
    expect(items[2]).toHaveClass('achievement-common'); // Rural Pioneer
  });

  it('filters completed achievements correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Click completed filter
    fireEvent.click(screen.getByText('Completed'));
    
    // Should show completed achievements
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();
    
    // Should not show incomplete achievements
    expect(screen.queryByText('Coverage Master')).not.toBeInTheDocument();
  });

  it('sorts achievements by rarity correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'rarity' } });
    
    const items = screen.getAllByTestId('achievement-item');
    expect(items[0]).toHaveTextContent('Speed Demon'); // Epic
    expect(items[1]).toHaveTextContent('Coverage Master'); // Rare
    expect(items[2]).toHaveTextContent('Rural Pioneer'); // Common
  });

  it('calls onAchievementClick when achievement is clicked', () => {
    const onAchievementClick = jest.fn();
    render(<AchievementShowcase achievements={mockAchievements} onAchievementClick={onAchievementClick} />);
    
    fireEvent.click(screen.getByText('Rural Pioneer'));
    expect(onAchievementClick).toHaveBeenCalledWith(mockAchievements[0]);
  });
});

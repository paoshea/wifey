import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementShowcase } from '../achievement-showcase';

const mockAchievements = [
  {
    id: '1',
    title: 'Rural Pioneer',
    description: 'Map your first rural area',
    icon: '🌲',
    tier: 'bronze' as const,
    points: 100,
    unlocked: true,
    requirements: {
      type: 'rural_measurements',
      count: 1
    }
  },
  {
    id: '2',
    title: 'Coverage Expert',
    description: 'Map 100 unique locations',
    icon: '📍',
    tier: 'silver' as const,
    points: 500,
    unlocked: false,
    requirements: {
      type: 'unique_locations',
      count: 100
    }
  },
  {
    id: '3',
    title: 'Master Mapper',
    description: 'Complete 1000 measurements',
    icon: '🏆',
    tier: 'gold' as const,
    points: 1000,
    unlocked: false,
    requirements: {
      type: 'total_measurements',
      count: 1000
    }
  }
];

describe('AchievementShowcase', () => {
  it('renders achievement stats correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    expect(screen.getByText('1/3')).toBeInTheDocument(); // Unlocked/Total
    expect(screen.getByText('100')).toBeInTheDocument(); // Total points
    expect(screen.getByText('33%')).toBeInTheDocument(); // Completion rate
  });

  it('filters achievements by status', async () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Select unlocked achievements
    const filterSelect = screen.getByRole('combobox', { name: /filter/i });
    await userEvent.selectOptions(filterSelect, 'unlocked');
    
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.queryByText('Coverage Expert')).not.toBeInTheDocument();
  });

  it('filters achievements by tier', async () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Select silver tier
    const tierSelect = screen.getByRole('combobox', { name: /tier/i });
    await userEvent.selectOptions(tierSelect, 'silver');
    
    expect(screen.queryByText('Rural Pioneer')).not.toBeInTheDocument();
    expect(screen.getByText('Coverage Expert')).toBeInTheDocument();
    expect(screen.queryByText('Master Mapper')).not.toBeInTheDocument();
  });

  it('searches achievements by title and description', async () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const searchInput = screen.getByPlaceholderText(/search achievements/i);
    await userEvent.type(searchInput, 'rural');
    
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.queryByText('Coverage Expert')).not.toBeInTheDocument();
  });

  it('opens achievement details modal on click', async () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const achievement = screen.getByText('Rural Pioneer').closest('div');
    fireEvent.click(achievement!);
    
    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('1 rural measurements')).toBeInTheDocument();
  });

  it('shows empty state when no achievements match filters', async () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const searchInput = screen.getByPlaceholderText(/search achievements/i);
    await userEvent.type(searchInput, 'nonexistent achievement');
    
    expect(screen.getByText('No achievements found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search query')).toBeInTheDocument();
  });

  it('displays correct achievement card styling based on unlock status', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const unlockedAchievement = screen.getByText('Rural Pioneer').closest('div');
    const lockedAchievement = screen.getByText('Coverage Expert').closest('div');
    
    expect(unlockedAchievement).toHaveClass('bg-orange-600'); // Bronze tier color
    expect(lockedAchievement).toHaveClass('bg-gray-800'); // Locked color
  });

  it('shows achievement points and tier information', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    mockAchievements.forEach(achievement => {
      const card = screen.getByText(achievement.title).closest('div');
      const pointsText = within(card!).getByText(`+${achievement.points} pts`);
      const tierText = within(card!).getByText(achievement.tier);
      
      expect(pointsText).toBeInTheDocument();
      expect(tierText).toBeInTheDocument();
    });
  });
});

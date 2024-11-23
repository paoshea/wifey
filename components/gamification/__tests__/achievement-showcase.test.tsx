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
    rarity: 'common',
    progress: 1,
    target: 1,
    completed: true,
    reward: {
      points: 100,
      badge: 'pioneer_badge'
    }
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    rarity: 'rare',
    progress: 750,
    target: 1000,
    completed: false,
    reward: {
      points: 500,
      badge: 'master_badge'
    }
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    earnedDate: '2024-01-15',
    rarity: 'epic',
    progress: 50,
    target: 50,
    completed: true,
    reward: {
      points: 250,
      badge: 'speed_badge'
    }
  }
];

describe('AchievementShowcase', () => {
  it('renders all achievements correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.getByText('Coverage Master')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();
  });

  it('displays achievement details with correct formatting', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const ruralPioneer = screen.getByText('Rural Pioneer').closest('div');
    expect(ruralPioneer).toHaveTextContent('🌲');
    expect(ruralPioneer).toHaveTextContent('Complete your first rural area measurement');
    expect(ruralPioneer).toHaveTextContent('100 points');
  });

  it('shows progress for incomplete achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const coverageMaster = screen.getByText('Coverage Master').closest('div');
    expect(coverageMaster).toHaveTextContent('750/1000');
    expect(coverageMaster).toHaveTextContent('75%');
  });

  it('displays earned date for completed achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    expect(screen.getByText('Earned: Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Earned: Jan 15, 2024')).toBeInTheDocument();
  });

  it('applies correct styling based on rarity', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const commonAchievement = screen.getByText('Rural Pioneer').closest('div');
    const rareAchievement = screen.getByText('Coverage Master').closest('div');
    const epicAchievement = screen.getByText('Speed Demon').closest('div');

    expect(commonAchievement).toHaveClass('achievement-common');
    expect(rareAchievement).toHaveClass('achievement-rare');
    expect(epicAchievement).toHaveClass('achievement-epic');
  });

  it('handles achievement click events', () => {
    const onAchievementClick = jest.fn();
    render(
      <AchievementShowcase 
        achievements={mockAchievements} 
        onAchievementClick={onAchievementClick} 
      />
    );
    
    fireEvent.click(screen.getByText('Rural Pioneer'));
    expect(onAchievementClick).toHaveBeenCalledWith(mockAchievements[0]);
  });

  it('shows empty state when no achievements are provided', () => {
    render(<AchievementShowcase achievements={[]} />);
    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
  });

  it('handles loading state gracefully', () => {
    render(<AchievementShowcase achievements={undefined} />);
    expect(screen.getByText('Loading achievements...')).toBeInTheDocument();
  });

  it('filters achievements correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const filterCompleted = screen.getByText('Completed');
    fireEvent.click(filterCompleted);
    
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();
    expect(screen.queryByText('Coverage Master')).not.toBeInTheDocument();
  });

  it('sorts achievements by different criteria', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'rarity' } });
    
    const achievements = screen.getAllByTestId('achievement-item');
    expect(achievements[0]).toHaveTextContent('Speed Demon'); // Epic should be first
    expect(achievements[1]).toHaveTextContent('Coverage Master'); // Rare should be second
    expect(achievements[2]).toHaveTextContent('Rural Pioneer'); // Common should be last
  });
});

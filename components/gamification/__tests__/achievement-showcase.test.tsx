import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementShowcase } from '../achievement-showcase';
import { 
  Achievement, 
  AchievementCategory, 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric
} from '@/lib/gamification/types';
import { validateAchievement } from '@/lib/gamification/validation';

const mockAchievements: Achievement[] = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    rarity: 'COMMON',
    tier: AchievementTier.BRONZE,
    progress: 1,
    target: 1,
    points: 100,
    category: AchievementCategory.RURAL_EXPLORER,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.RURAL_MEASUREMENTS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 1
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    rarity: 'RARE',
    tier: AchievementTier.GOLD,
    progress: 750,
    target: 1000,
    points: 500,
    category: AchievementCategory.COVERAGE_EXPERT,
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.UNIQUE_LOCATIONS,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      value: 1000
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Validate mock achievements
mockAchievements.forEach(achievement => {
  const validationResult = validateAchievement(achievement);
  if (!validationResult.success) {
    throw new Error(`Invalid mock achievement: ${validationResult.error}`);
  }
});

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

    // Check descriptions
    expect(screen.getByText('Complete your first rural area measurement')).toBeInTheDocument();
    expect(screen.getByText('Map 1000 unique locations')).toBeInTheDocument();

    // Check points
    expect(screen.getByText('100 points')).toBeInTheDocument();
    expect(screen.getByText('500 points')).toBeInTheDocument();
  });

  it('displays progress for incomplete achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Coverage Master is incomplete
    expect(screen.getByText('Progress: 750/1000 (75%)')).toBeInTheDocument();
  });

  it('applies correct rarity classes to achievements', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const items = screen.getAllByTestId('achievement-item');
    expect(items[0]).toHaveClass('achievement-rare'); // Coverage Master
    expect(items[1]).toHaveClass('achievement-common'); // Rural Pioneer
  });

  it('filters completed achievements correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    // Click completed filter
    fireEvent.click(screen.getByText('Completed'));
    
    // Should show completed achievements
    expect(screen.getByText('Rural Pioneer')).toBeInTheDocument();
    
    // Should not show incomplete achievements
    expect(screen.queryByText('Coverage Master')).not.toBeInTheDocument();
  });

  it('sorts achievements by rarity correctly', () => {
    render(<AchievementShowcase achievements={mockAchievements} />);
    
    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'rarity' } });
    
    const items = screen.getAllByTestId('achievement-item');
    expect(items[0]).toHaveTextContent('Coverage Master'); // Rare
    expect(items[1]).toHaveTextContent('Rural Pioneer'); // Common
  });

  it('calls onAchievementClick when achievement is clicked', () => {
    const onAchievementClick = jest.fn();
    render(<AchievementShowcase achievements={mockAchievements} onAchievementClick={onAchievementClick} />);
    
    fireEvent.click(screen.getByText('Rural Pioneer'));
    expect(onAchievementClick).toHaveBeenCalledWith(mockAchievements[0]);
  });
});

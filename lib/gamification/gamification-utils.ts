import { Achievement } from './types';

export function calculateLevel(points: number): number {
  if (points < 0) return 1;
  if (points >= 100000) return 10; // Max level cap
  
  const levels = [0, 100, 500, 1500, 5000, 15000, 30000, 50000, 75000, 100000];
  return levels.findIndex(threshold => points < threshold) || 10;
}

export function calculateProgress(current: number, min: number, max: number): number {
  if (max <= min) return 0;
  if (current >= max) return 1;
  if (current <= min) return 0;
  return (current - min) / (max - min);
}

export function getNextLevelThreshold(currentLevel: number): number | null {
  if (currentLevel < 1) return 100;
  if (currentLevel >= 10) return null;
  
  const thresholds = [100, 500, 1500, 5000, 15000, 30000, 50000, 75000, 100000];
  return thresholds[currentLevel - 1];
}

export function formatActivityData(data: Array<{ date: string; measurements: number; rural: number }>) {
  return data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.measurements,
    ruralValue: item.rural
  }));
}

export function calculateAchievementProgress(achievement: { target: number; progress: number }): number {
  if (achievement.target === 0) return 0;
  return Math.min(achievement.progress / achievement.target, 1);
}

export function getRarityColor(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
  const colors = {
    common: 'gray',
    rare: 'blue',
    epic: 'purple',
    legendary: 'orange'
  };
  return colors[rarity] || colors.common;
}

export function sortAchievements(
  achievements: Achievement[],
  sortBy: 'rarity' | 'progress' | 'earned'
): Achievement[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  
  return [...achievements].sort((a, b) => {
    switch (sortBy) {
      case 'rarity':
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      case 'progress':
        return calculateAchievementProgress(b) - calculateAchievementProgress(a);
      case 'earned':
        if (!a.earnedDate) return 1;
        if (!b.earnedDate) return -1;
        return new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime();
      default:
        return 0;
    }
  });
}

export function filterAchievements(
  achievements: Achievement[],
  filters: {
    completed?: boolean;
    rarity?: string;
    search?: string;
  }
): Achievement[] {
  return achievements.filter(achievement => {
    if (filters.completed !== undefined && achievement.completed !== filters.completed) {
      return false;
    }
    
    if (filters.rarity && achievement.rarity !== filters.rarity) {
      return false;
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return achievement.title.toLowerCase().includes(searchTerm);
    }
    
    return true;
  });
}

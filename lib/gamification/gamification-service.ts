import { 
  Achievement, 
  UserProgress, 
  ContributionReward,
  LeaderboardEntry 
} from './types';
import { 
  ACHIEVEMENTS, 
  RURAL_BONUS_MULTIPLIER, 
  FIRST_IN_AREA_BONUS,
  STREAK_BONUS_MULTIPLIER,
  calculateLevel,
  getNextLevelThreshold
} from './achievements';

export class GamificationService {
  private async getUserProgress(userId: string): Promise<UserProgress> {
    // TODO: Implement database fetch
    return {
      totalPoints: 0,
      level: 1,
      achievements: [],
      stats: {
        totalMeasurements: 0,
        ruralMeasurements: 0,
        verifiedSpots: 0,
        helpfulActions: 0,
        consecutiveDays: 0,
        lastMeasurementDate: new Date().toISOString()
      }
    };
  }

  private async updateUserProgress(userId: string, progress: UserProgress): Promise<void> {
    // TODO: Implement database update
  }

  async processMeasurement(
    userId: string, 
    isRuralArea: boolean,
    isFirstInArea: boolean,
    quality: number // 0-1 measurement quality score
  ): Promise<ContributionReward> {
    const userProgress = await this.getUserProgress(userId);
    const basePoints = 10; // Base points for any measurement
    let totalPoints = basePoints;
    const bonuses: ContributionReward['bonuses'] = {};

    // Apply rural bonus
    if (isRuralArea) {
      const ruralBonus = Math.floor(basePoints * (RURAL_BONUS_MULTIPLIER - 1));
      totalPoints += ruralBonus;
      bonuses.ruralArea = ruralBonus;
      userProgress.stats.ruralMeasurements++;
    }

    // Apply first-in-area bonus
    if (isFirstInArea) {
      totalPoints += FIRST_IN_AREA_BONUS;
      bonuses.firstInArea = FIRST_IN_AREA_BONUS;
    }

    // Apply streak bonus
    const lastMeasurement = new Date(userProgress.stats.lastMeasurementDate);
    const today = new Date();
    const dayDiff = Math.floor((today.getTime() - lastMeasurement.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      userProgress.stats.consecutiveDays++;
      const streakBonus = Math.floor(basePoints * (STREAK_BONUS_MULTIPLIER - 1));
      totalPoints += streakBonus;
      bonuses.consistencyStreak = streakBonus;
    } else if (dayDiff > 1) {
      userProgress.stats.consecutiveDays = 1;
    }

    // Apply quality bonus
    const qualityBonus = Math.floor(basePoints * quality);
    totalPoints += qualityBonus;
    bonuses.qualityBonus = qualityBonus;

    // Update user stats
    userProgress.stats.totalMeasurements++;
    userProgress.stats.lastMeasurementDate = today.toISOString();
    userProgress.totalPoints += totalPoints;

    // Check for new achievements
    const newAchievements = this.checkAchievements(userProgress);
    for (const achievement of newAchievements) {
      userProgress.achievements.push(achievement.id);
      userProgress.totalPoints += achievement.points;
    }

    // Check for level up
    const oldLevel = userProgress.level;
    const newLevel = calculateLevel(userProgress.totalPoints);
    const levelUp = newLevel > oldLevel ? {
      newLevel,
      rewards: this.getLevelRewards(newLevel)
    } : undefined;

    if (levelUp) {
      userProgress.level = newLevel;
    }

    // Save progress
    await this.updateUserProgress(userId, userProgress);

    return {
      points: totalPoints,
      bonuses,
      achievements: newAchievements,
      levelUp
    };
  }

  private checkAchievements(progress: UserProgress): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (progress.achievements.includes(achievement.id)) {
        continue;
      }

      let earned = false;
      switch (achievement.requirements.type) {
        case 'measurements':
          earned = progress.stats.totalMeasurements >= achievement.requirements.count;
          break;
        case 'rural_measurements':
          earned = progress.stats.ruralMeasurements >= achievement.requirements.count;
          break;
        case 'verified_spots':
          earned = progress.stats.verifiedSpots >= achievement.requirements.count;
          break;
        case 'helping_others':
          earned = progress.stats.helpfulActions >= achievement.requirements.count;
          break;
        case 'consistency':
          earned = progress.stats.consecutiveDays >= achievement.requirements.count;
          break;
      }

      if (earned) {
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  private getLevelRewards(level: number): string[] {
    const rewards: string[] = [];
    
    // Define rewards for each level
    switch (level) {
      case 5:
        rewards.push('Unlock custom profile badge');
        break;
      case 10:
        rewards.push('Unlock verified contributor status');
        break;
      case 15:
        rewards.push('Unlock coverage expert badge');
        break;
      default:
        rewards.push('Bonus points multiplier increased');
    }

    return rewards;
  }

  async getLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    // TODO: Implement leaderboard fetch from database
    return [];
  }

  async getUserRank(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ): Promise<{ rank: number; total: number }> {
    // TODO: Implement user rank fetch from database
    return { rank: 1, total: 1 };
  }
}

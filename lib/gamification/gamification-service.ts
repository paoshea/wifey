import { 
  Achievement, 
  UserProgress, 
  ContributionReward,
  LeaderboardEntry,
  AchievementRequirementType 
} from './types';
import { 
  ACHIEVEMENTS, 
  RURAL_BONUS_MULTIPLIER, 
  FIRST_IN_AREA_BONUS,
  QUALITY_BONUS_MAX,
  calculateLevel,
  getNextLevelThreshold,
  calculateAchievementProgress
} from './achievements';

export class GamificationService {
  private userProgress: Map<string, UserProgress> = new Map();
  
  constructor() {
    // Initialize with empty user progress
  }

  private async getUserProgress(userId: string): Promise<UserProgress | null> {
    // TODO: Implement database fetch
    return this.userProgress.get(userId) || null;
  }

  private async updateUserProgress(userId: string, progress: UserProgress): Promise<void> {
    // TODO: Implement database update
    this.userProgress.set(userId, progress);
  }

  public async processMeasurement(userId: string, measurement: { 
    isRural: boolean;
    isFirstInArea: boolean;
    quality: number;
  }): Promise<ContributionReward> {
    const { isRural, isFirstInArea, quality } = measurement;
    let userProgress = await this.getUserProgress(userId) || {
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

    // Calculate base points and bonuses
    let points = 10; // Base points for measurement
    const bonuses: ContributionReward['bonuses'] = {};

    if (isRural) {
      const ruralBonus = Math.round(points * RURAL_BONUS_MULTIPLIER);
      points += ruralBonus;
      bonuses.ruralArea = ruralBonus;
      userProgress.stats.ruralMeasurements++;
    }

    if (isFirstInArea) {
      points += FIRST_IN_AREA_BONUS;
      bonuses.firstInArea = FIRST_IN_AREA_BONUS;
    }

    // Quality bonus (0-10 points based on quality score)
    const qualityBonus = Math.round(quality * QUALITY_BONUS_MAX);
    points += qualityBonus;
    bonuses.qualityBonus = qualityBonus;

    // Update user progress
    const today = new Date();
    const lastMeasurementDate = new Date(userProgress.stats.lastMeasurementDate);
    const daysSinceLastMeasurement = Math.floor((today.getTime() - lastMeasurementDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastMeasurement === 1) {
      userProgress.stats.consecutiveDays++;
      const streakBonus = Math.min(userProgress.stats.consecutiveDays, 7);
      points += streakBonus;
      bonuses.consistencyStreak = streakBonus;
    } else if (daysSinceLastMeasurement > 1) {
      userProgress.stats.consecutiveDays = 1;
    }

    userProgress.stats.totalMeasurements++;
    userProgress.stats.lastMeasurementDate = today.toISOString();
    userProgress.totalPoints += points;

    // Check for new achievements
    const newAchievements = await this.checkAchievements(userId, userProgress.stats);
    for (const achievement of newAchievements) {
      userProgress.achievements.push(achievement.id);
      userProgress.totalPoints += achievement.points;
    }

    // Check for level up
    const newLevel = calculateLevel(userProgress.totalPoints);
    const levelUp = newLevel > userProgress.level ? {
      newLevel,
      rewards: this.getLevelRewards(newLevel)
    } : undefined;
    userProgress.level = newLevel;

    await this.updateUserProgress(userId, userProgress);

    return {
      points,
      bonuses,
      achievements: newAchievements,
      levelUp
    };
  }

  private async checkAchievements(userId: string, stats: UserProgress['stats']): Promise<Achievement[]> {
    const earnedAchievements: Achievement[] = [];
    const userAchievements = await this.getUserAchievements(userId);

    for (const achievement of userAchievements) {
      if (achievement.completed) continue;

      const { type, count } = achievement.requirements;
      let currentProgress = 0;

      switch (type) {
        case 'measurements':
          currentProgress = stats.totalMeasurements;
          break;
        case 'rural_measurements':
          currentProgress = stats.ruralMeasurements;
          break;
        case 'verified_spots':
          currentProgress = stats.verifiedSpots;
          break;
        case 'helping_others':
          currentProgress = stats.helpfulActions;
          break;
        case 'consistency':
          currentProgress = stats.consecutiveDays;
          break;
      }

      achievement.progress = currentProgress;
      if (currentProgress >= count && !achievement.completed) {
        achievement.completed = true;
        achievement.earnedDate = new Date().toISOString();
        earnedAchievements.push(achievement);
      }
    }

    return earnedAchievements;
  }

  public async getUserAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return [...ACHIEVEMENTS]; // Return copy of base achievements for new users
    }

    // Merge base achievements with user progress
    return ACHIEVEMENTS.map(achievement => {
      const userAchievement = { ...achievement };
      if (progress.achievements.includes(achievement.id)) {
        userAchievement.completed = true;
      }
      return userAchievement;
    });
  }

  public async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime'): Promise<LeaderboardEntry[]> {
    // TODO: Implement proper leaderboard with timeframe filtering
    const entries: LeaderboardEntry[] = [];
    for (const [userId, progress] of this.userProgress.entries()) {
      entries.push({
        userId,
        username: `User ${userId}`,
        points: progress.totalPoints,
        rank: 0 // Will be calculated after sorting
      });
    }
    
    // Sort by points and assign ranks
    return entries
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  private getLevelRewards(level: number): string[] {
    const rewards: string[] = [];
    
    // Add level-specific rewards
    if (level % 5 === 0) {
      rewards.push('special_badge');
    }
    if (level % 10 === 0) {
      rewards.push('premium_feature');
    }
    
    return rewards;
  }
}

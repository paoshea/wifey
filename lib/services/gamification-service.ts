import { GamificationDB } from './db/gamification-db';
import type { Measurement } from '@prisma/client';
import { cache } from 'react';

class GamificationService {
  private db: GamificationDB;

  constructor() {
    this.db = new GamificationDB();
  }

  async processMeasurement(measurement: Measurement, userId: string): Promise<void> {
    await this.db.processMeasurement(measurement, userId);
    
    // Recalculate leaderboard position
    const score = await this.calculateScore(userId);
    await this.updateLeaderboards(userId, score);
  }

  async getUserProgress(userId: string) {
    return this.db.getUserProgress(userId);
  }

  private async calculateScore(userId: string): Promise<number> {
    const stats = (await this.getUserProgress(userId))?.stats;
    if (!stats) return 0;

    // Score calculation formula
    return (
      stats.totalMeasurements * 10 +
      stats.ruralMeasurements * 20 +
      stats.uniqueLocations * 30 +
      Math.floor(stats.totalDistance / 1000) * 50 +
      stats.contributionScore * 2
    );
  }

  private async updateLeaderboards(userId: string, score: number): Promise<void> {
    const timeframes: ('daily' | 'weekly' | 'monthly' | 'allTime')[] = [
      'daily',
      'weekly',
      'monthly',
      'allTime'
    ];

    await Promise.all(
      timeframes.map(timeframe =>
        this.db.updateLeaderboardEntry(userId, { score, timeframe })
      )
    );
  }

  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime', limit = 100) {
    return this.db.getLeaderboard(timeframe, limit);
  }

  async getUserRank(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime') {
    return this.db.calculateUserRank(userId, timeframe);
  }
}

// Create a singleton instance
export const gamificationService = new GamificationService();

// Create cached versions of frequently used methods
export const getCachedUserProgress = cache(async (userId: string) => {
  return gamificationService.getUserProgress(userId);
});

export const getCachedLeaderboard = cache(async (
  timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
  limit = 100
) => {
  return gamificationService.getLeaderboard(timeframe, limit);
});

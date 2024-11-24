import { GamificationDB } from './db/gamification-db';
import type { Measurement, UserProgress, Achievement } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { cache } from 'react';

interface UserStats {
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
  lastUpdated: Date;
}

interface UserProgressWithStats extends UserProgress {
  stats: UserStats;
  achievements: Array<{
    achievementId: string;
    achievement: Achievement;
    unlockedAt: Date | null;
  }>;
}

interface MeasurementData {
  isRural: boolean;
  location: any;
  latitude: number;
  longitude: number;
}

class GamificationService {
  private db: GamificationDB;

  constructor() {
    this.db = new GamificationDB();
  }

  async processMeasurement(measurement: Measurement, userId: string): Promise<void> {
    // Convert Measurement to MeasurementData
    const location = this.parseLocation(measurement.location);
    
    const measurementData: MeasurementData = {
      isRural: location ? this.isRuralLocation(location) : false,
      location: measurement.location,
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0
    };

    await this.db.processMeasurement(userId, measurementData);
    
    // Recalculate leaderboard position
    const score = await this.calculateScore(userId);
    await this.updateLeaderboards(userId, score);
  }

  async getUserProgress(userId: string): Promise<UserProgressWithStats | null> {
    const progress = await this.db.getUserProgress(userId);
    if (!progress) return null;

    return {
      ...progress,
      stats: {
        ...progress.stats,
        lastUpdated: progress.stats.updatedAt
      }
    };
  }

  private async calculateScore(userId: string): Promise<number> {
    const progress = await this.getUserProgress(userId);
    if (!progress?.stats) return 0;

    const {
      totalMeasurements,
      ruralMeasurements,
      uniqueLocations,
      totalDistance,
      contributionScore
    } = progress.stats;

    // Score calculation formula
    return (
      totalMeasurements * 10 +
      ruralMeasurements * 20 +
      uniqueLocations * 30 +
      Math.floor(totalDistance / 1000) * 50 +
      contributionScore * 2
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

  private parseLocation(location: JsonValue | null): { latitude: number; longitude: number; type?: string } | null {
    if (
      location &&
      typeof location === 'object' &&
      'latitude' in location &&
      'longitude' in location &&
      typeof (location as any).latitude === 'number' &&
      typeof (location as any).longitude === 'number'
    ) {
      return {
        latitude: (location as any).latitude,
        longitude: (location as any).longitude,
        type: (location as any).type as string | undefined
      };
    }
    return null;
  }

  private isRuralLocation(location: { latitude: number; longitude: number; type?: string }): boolean {
    // Implement rural location detection logic
    // This is a placeholder - implement your actual rural detection logic
    return location.type === 'rural';
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

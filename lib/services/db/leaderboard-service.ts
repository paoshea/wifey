import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { TimeFrame, type LeaderboardEntry, type LeaderboardResponse } from '../../gamification/types';
import { GamificationError } from '../../gamification/errors';

interface LeaderboardEntryData {
    id: string;
    userId: string;
    timeframe: string;
    points: number;
    rank: number;
    username: string;
    measurements: number;
    lastActive: Date;
}

export class LeaderboardService {
    private prisma: PrismaClient;

    constructor(prismaClient: PrismaClient = prisma) {
        this.prisma = prismaClient;
    }

    private mapToLeaderboardEntry(entry: LeaderboardEntryData): LeaderboardEntry {
        return {
            id: entry.id,
            timeframe: entry.timeframe as TimeFrame,
            points: entry.points,
            rank: entry.rank,
            username: entry.username,
            level: Math.floor(entry.points / 1000),
            contributions: entry.measurements,
            badges: 0,
            streak: {
                current: 0,
                longest: 0
            },
            recentAchievements: [],
            user: {
                id: entry.userId,
                name: entry.username,
                rank: entry.rank,
                measurements: entry.measurements,
                lastActive: entry.lastActive
            }
        };
    }

    async getLeaderboard(
        timeframe: TimeFrame = TimeFrame.ALL_TIME,
        page = 1,
        pageSize = 10
    ): Promise<LeaderboardResponse> {
        try {
            const skip = (page - 1) * pageSize;

            const [entries, totalUsers] = await Promise.all([
                this.prisma.user.findMany({
                    skip,
                    take: pageSize,
                    include: {
                        stats: true,
                        measurements: {
                            select: {
                                id: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: {
                        stats: {
                            points: 'desc'
                        }
                    }
                }).then(users => users.map((user, index) => ({
                    id: user.id,
                    userId: user.id,
                    timeframe: timeframe,
                    points: user.stats?.points || 0,
                    rank: skip + index + 1,
                    username: user.name || '',
                    measurements: user.measurements.length,
                    lastActive: user.measurements[0]?.createdAt || new Date()
                }))),
                this.prisma.user.count()
            ]);

            return {
                timeframe,
                entries: entries.map(entry => this.mapToLeaderboardEntry(entry)),
                totalUsers
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error getting leaderboard:', err);
            throw new GamificationError('Failed to fetch leaderboard', 'LEADERBOARD_ERROR');
        }
    }

    async getUserRank(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
        try {
            const userStats = await this.prisma.userStats.findUnique({
                where: { userId }
            });

            if (!userStats) return null;

            const higherRankedCount = await this.prisma.userStats.count({
                where: {
                    points: {
                        gt: userStats.points
                    }
                }
            });

            return higherRankedCount + 1;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error getting user rank:', err);
            throw new GamificationError('Failed to fetch user rank', 'USER_RANK_ERROR');
        }
    }

    async getLeaderboardPosition(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<LeaderboardEntry | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    stats: true,
                    measurements: {
                        select: {
                            id: true,
                            createdAt: true
                        }
                    }
                }
            });

            if (!user) return null;

            const rank = await this.getUserRank(userId, timeframe);
            if (!rank) return null;

            const entry: LeaderboardEntryData = {
                id: user.id,
                userId: user.id,
                timeframe: timeframe,
                points: user.stats?.points || 0,
                rank,
                username: user.name || '',
                measurements: user.measurements.length,
                lastActive: user.measurements[0]?.createdAt || new Date()
            };

            return this.mapToLeaderboardEntry(entry);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error getting leaderboard position:', err);
            throw new GamificationError('Failed to fetch leaderboard position', 'LEADERBOARD_POSITION_ERROR');
        }
    }
}

export const leaderboardService = new LeaderboardService();

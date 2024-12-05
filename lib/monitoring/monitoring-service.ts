import { Prisma, PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export type Severity = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export interface ValidErrorLog {
  errorType: string;
  message: string;
  stack?: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
}

export interface ValidPerformanceLog {
  operation: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  error: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface PerformanceLogEntry {
  operation: string;
  duration: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';

export const TimeFrame = {
  LAST_24H: 'daily' as const,
  LAST_7D: 'weekly' as const,
  LAST_30D: 'monthly' as const,
  ALL_TIME: 'allTime' as const
} as const;

interface ErrorMetrics {
  totalErrors: number;
  errorBreakdown: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

interface PerformanceMetrics {
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  totalCount: number;
  successRate?: number;
}

// Helper function to validate error log data
function validateErrorLog(data: Partial<ValidErrorLog>): ValidErrorLog {
  if (!data.errorType || !data.message || !data.severity) {
    throw new Error('Invalid error log data');
  }
  return data as ValidErrorLog;
}

// Helper function to validate performance log data
function validatePerformanceLog(data: Partial<ValidPerformanceLog>): ValidPerformanceLog {
  if (!data.operation || typeof data.duration !== 'number') {
    throw new Error('Invalid performance log data');
  }
  return data as ValidPerformanceLog;
}

// Helper function to get start date for timeframe
function getStartDateForTimeframe(timeframe: TimeFrame): Date {
  const now = new Date();
  switch (timeframe) {
    case TimeFrame.LAST_24H:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case TimeFrame.LAST_7D:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case TimeFrame.LAST_30D:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case TimeFrame.ALL_TIME:
      return new Date(0);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

export class MonitoringService {
  private static instance: MonitoringService;
  private prisma: PrismaClient;
  private performanceThresholds: Record<string, number> = {
    db_operation: 100, // ms
    api_request: 500,  // ms
    calculation: 50    // ms
  };

  private constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  public static getInstance(prismaClient: PrismaClient): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(prismaClient);
    }
    return MonitoringService.instance;
  }

  /**
   * Log an error with both database and Sentry
   */
  public async logError(
    error: Error | unknown,
    severity: Severity = 'error',
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const errorData: ValidErrorLog = validateErrorLog({
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      severity,
      metadata
    });

    // Log to database
    try {
      const baseData: ErrorLogEntry = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        metadata,
        timestamp: new Date()
      };

      if (userId) {
        const userStats = await this.prisma.userStats.findUnique({ where: { userId } });
        const existingStats = userStats?.stats as Record<string, any> || {};
        const currentLogs = existingStats.errorLogs || [];

        await this.prisma.userStats.update({
          where: { userId },
          data: {
            stats: {
              ...existingStats,
              errorLogs: [...currentLogs, baseData]
            }
          }
        });
      } else {
        // Skip database logging if no user is associated
        console.warn('Skipping error log creation: no userId provided');
      }
    } catch (error: unknown) {
      console.error('Failed to log error to database:', error);
    }

    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setLevel(severity as Sentry.SeverityLevel);
      if (userId) scope.setUser({ id: userId });
      if (metadata) scope.setExtras(metadata);
      Sentry.captureException(error);
    });
  }

  /**
   * Start performance monitoring for an operation
   */
  public startPerformanceTracking(
    operation: string,
    userId?: string
  ): PerformanceTracker {
    return new PerformanceTracker(this, operation, userId);
  }

  /**
   * Log performance data
   */
  private async logPerformance(
    performanceData: ValidPerformanceLog,
    metadata: Record<string, unknown> = {},
    userId?: string
  ): Promise<void> {
    // Log to database
    try {
      const baseData: PerformanceLogEntry = {
        operation: performanceData.operation,
        duration: performanceData.duration,
        metadata: performanceData.metadata,
        timestamp: new Date()
      };

      if (userId) {
        const userStats = await this.prisma.userStats.findUnique({ where: { userId } });
        const existingStats = userStats?.stats as Record<string, any> || {};
        const currentLogs = existingStats.performanceLogs || [];

        await this.prisma.userStats.update({
          where: { userId },
          data: {
            stats: {
              ...existingStats,
              performanceLogs: [...currentLogs, baseData]
            }
          }
        });
      } else {
        // Skip database logging if no user is associated
        console.warn('Skipping performance log creation: no userId provided');
      }
    } catch (error: unknown) {
      console.error('Failed to log performance to database:', error);
    }

    // Log to Sentry if performance is poor
    const threshold = this.performanceThresholds[performanceData.operation] ?? 1000;
    if (performanceData.duration > threshold) {
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        if (userId) scope.setUser({ id: userId });
        scope.setExtra('duration', performanceData.duration);
        scope.setExtra('threshold', threshold);
        if (metadata) scope.setExtras(metadata);
        Sentry.captureMessage(
          `Performance threshold exceeded for ${performanceData.operation}`,
          'warning'
        );
      });
    }
  }

  /**
   * Set custom performance thresholds
   */
  public setPerformanceThresholds(thresholds: Record<string, number>): void {
    this.performanceThresholds = {
      ...this.performanceThresholds,
      ...thresholds
    };
  }

  /**
   * Get performance metrics for analysis
   */
  public async getPerformanceMetrics(
    timeframe: TimeFrame = TimeFrame.LAST_24H
  ): Promise<PerformanceMetrics> {
    const startDate = getStartDateForTimeframe(timeframe);

    // Get all user stats
    const userStats = await this.prisma.userStats.findMany({
      select: {
        stats: true
      }
    });

    // Extract and filter performance logs
    const performanceLogs = userStats.flatMap(stats => {
      const logs = ((stats.stats as any)?.performanceLogs || []) as PerformanceLogEntry[];
      return logs.filter(log => new Date(log.timestamp) >= startDate);
    });

    const totalCount = performanceLogs.length;
    const durations = performanceLogs.map(log => log.duration);
    const averageDuration = totalCount > 0 ? durations.reduce((a, b) => a + b, 0) / totalCount : 0;
    const maxDuration = totalCount > 0 ? Math.max(...durations) : 0;
    const minDuration = totalCount > 0 ? Math.min(...durations) : 0;

    return {
      averageDuration,
      maxDuration,
      minDuration,
      totalCount
    };
  }

  /**
   * Get error metrics for analysis
   */
  public async getErrorMetrics(
    timeframe: TimeFrame = TimeFrame.LAST_24H
  ): Promise<ErrorMetrics> {
    const startDate = getStartDateForTimeframe(timeframe);

    // Get all user stats
    const userStats = await this.prisma.userStats.findMany({
      select: {
        stats: true
      }
    });

    // Extract and filter error logs
    const errorLogs = userStats.flatMap(stats => {
      const logs = ((stats.stats as any)?.errorLogs || []) as ErrorLogEntry[];
      return logs.filter(log => new Date(log.timestamp) >= startDate);
    });

    // Group errors
    const errorGroups = errorLogs.reduce((acc, log) => {
      acc[log.error] = (acc[log.error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalErrors = errorLogs.length;

    const errorBreakdown = Object.entries(errorGroups).map(([error, count]) => ({
      error,
      count: count as number,
      percentage: (count / totalErrors) * 100
    }));

    return {
      totalErrors,
      errorBreakdown
    };
  }
}

/**
 * Helper class for tracking performance of operations
 */
class PerformanceTracker {
  private startTime: number;
  private metadata: Record<string, unknown> = {};

  constructor(
    private monitoringService: MonitoringService,
    private operation: string,
    private userId?: string
  ) {
    this.startTime = performance.now();
  }

  /**
   * Add metadata to be included in the performance log
   */
  public addMetadata(metadata: Record<string, unknown>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * End performance tracking and log results
   */
  public async end(): Promise<void> {
    const duration = Math.round(performance.now() - this.startTime);
    await (this.monitoringService as any).logPerformance(
      { operation: this.operation, duration },
      this.metadata,
      this.userId
    );
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance(new PrismaClient());

// lib/monitoring/monitoring-service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { captureException } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';
import {
  validateErrorLog,
  validatePerformanceLog,
  type ValidErrorLog,
  type ValidPerformanceLog,
  type Severity,
  getStartDateForTimeframe
} from '../services/db/validation';

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

type ErrorLogGroupByType = {
  error: string;
  _count: {
    _all: number;
  };
};

export class MonitoringService {
  private static instance: MonitoringService;
  private prisma: PrismaClient;
  private performanceThresholds: Record<string, number> = {
    db_operation: 100, // ms
    api_request: 500,  // ms
    calculation: 50    // ms
  };

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
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
      const baseData = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        metadata: metadata as Prisma.InputJsonValue,
        timestamp: new Date()
      };

      if (userId) {
        await this.prisma.errorLog.create({
          data: {
            ...baseData,
            user: { connect: { id: userId } }
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
    Sentry.withScope((scope: Sentry.Scope) => {
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
      const baseData = {
        operation: performanceData.operation,
        duration: performanceData.duration,
        metadata: performanceData.metadata as Prisma.InputJsonValue,
        timestamp: new Date()
      };

      if (userId) {
        await this.prisma.performanceLog.create({
          data: {
            ...baseData,
            user: { connect: { id: userId } }
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
      Sentry.withScope((scope: Sentry.Scope) => {
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

    const aggregateResult = await this.prisma.performanceLog.aggregate({
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      },
      _avg: {
        duration: true
      },
      _max: {
        duration: true
      }
    });

    const totalCount = aggregateResult._count?._all ?? 0;
    const averageDuration = aggregateResult._avg?.duration ?? 0;
    const maxDuration = aggregateResult._max?.duration ?? 0;

    return {
      averageDuration,
      maxDuration,
      minDuration: 0,
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

    const result = await this.prisma.errorLog.groupBy({
      by: ['error'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      }
    });

    const totalErrors = result.reduce((sum, group) => {
      return sum + (group._count?._all ?? 0);
    }, 0);

    const errorBreakdown = result.map(group => ({
      error: group.error,
      count: group._count?._all ?? 0,
      percentage: ((group._count?._all ?? 0) / totalErrors) * 100
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
export const monitoringService = MonitoringService.getInstance();

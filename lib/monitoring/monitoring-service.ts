import { PrismaClient, Prisma } from '@prisma/client';
import { captureException } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';
import { 
  validateErrorLog, 
  validatePerformanceLog,
  type ValidErrorLog,
  type ValidPerformanceLog,
  type Severity
} from '../services/db/validation';

interface ErrorMetrics {
  totalErrors: number;
  resolvedErrors: number;
  resolutionRate: number;
  errorsByType: Array<{
    type: string;
    severity: string;
    count: number;
  }>;
}

interface PerformanceMetrics {
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  successCount: number;
  totalCount: number;
  successRate: number;
}

type ErrorLogGroupByType = {
  errorType: string;
  severity: string;
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
      const data: Prisma.ErrorLogCreateInput = {
        ...errorData,
        user: userId ? { connect: { id: userId } } : undefined,
        resolved: false,
        timestamp: new Date(),
        metadata: metadata as Prisma.InputJsonValue
      };
      await this.prisma.errorLog.create({ data });
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
    operation: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const performanceData: ValidPerformanceLog = validatePerformanceLog({
      operation,
      duration,
      success,
      metadata
    });

    // Log to database
    try {
      const data: Prisma.PerformanceLogCreateInput = {
        operation: performanceData.operation,
        duration: performanceData.duration,
        success: performanceData.success,
        metadata: performanceData.metadata as Prisma.InputJsonValue,
        user: userId ? { connect: { id: userId } } : undefined,
        timestamp: new Date()
      };
      await this.prisma.performanceLog.create({ data });
    } catch (error: unknown) {
      console.error('Failed to log performance to database:', error);
    }

    // Log to Sentry if performance is poor
    const threshold = this.performanceThresholds[operation] ?? 1000;
    if (duration > threshold) {
      Sentry.withScope((scope: Sentry.Scope) => {
        scope.setLevel('warning');
        if (userId) scope.setUser({ id: userId });
        scope.setExtra('duration', duration);
        scope.setExtra('threshold', threshold);
        if (metadata) scope.setExtras(metadata);
        Sentry.captureMessage(
          `Performance threshold exceeded for ${operation}`,
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
    operation?: string,
    timeframe: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<PerformanceMetrics> {
    const where: Prisma.PerformanceLogWhereInput = {
      timestamp: {
        gte: timeframe.start,
        lte: timeframe.end
      },
      ...(operation && { operation })
    };

    const [aggregateResult, totalCount] = await Promise.all([
      this.prisma.performanceLog.aggregate({
        where,
        _avg: { duration: true },
        _max: { duration: true },
        _min: { duration: true },
        _count: { success: true }
      }),
      this.prisma.performanceLog.count({ where })
    ]);

    const successCount = aggregateResult._count.success;

    return {
      averageDuration: aggregateResult._avg.duration ?? 0,
      maxDuration: aggregateResult._max.duration ?? 0,
      minDuration: aggregateResult._min.duration ?? 0,
      successCount,
      totalCount,
      successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0
    };
  }

  /**
   * Get error metrics for analysis
   */
  public async getErrorMetrics(
    timeframe: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<ErrorMetrics> {
    const where: Prisma.ErrorLogWhereInput = {
      timestamp: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    };

    type GroupByResult = {
      errorType: string;
      severity: string;
      _count: {
        _all: number;
      };
    };

    const [totalCount, resolvedCount, groupedErrors] = await Promise.all([
      this.prisma.errorLog.count({ where }),
      this.prisma.errorLog.count({
        where: {
          ...where,
          resolved: true
        }
      }),
      this.prisma.errorLog.groupBy({
        by: ['errorType', 'severity'],
        where,
        _count: {
          _all: true
        }
      })
    ]);

    const errorsByType = groupedErrors.map(group => ({
      type: group.errorType,
      severity: group.severity,
      count: group._count._all
    }));

    return {
      totalErrors: totalCount,
      resolvedErrors: resolvedCount,
      resolutionRate: totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0,
      errorsByType
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
  public async end(success = true): Promise<void> {
    const duration = Math.round(performance.now() - this.startTime);
    await (this.monitoringService as any).logPerformance(
      this.operation,
      duration,
      success,
      this.userId,
      this.metadata
    );
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// lib/api/error-handler.ts

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { trackError } from '../monitoring/sentry';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    validationErrors?: Record<string, string[]>;
  };
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for monitoring
  trackError(error instanceof Error ? error : new Error('Unknown error'), {
    type: 'api_error',
    timestamp: new Date().toISOString(),
  });

  // Handle known error types
  if (error instanceof ApiError) {
    return new NextResponse<ErrorResponse>(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return new NextResponse<ErrorResponse>(
      JSON.stringify({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          validationErrors: error.flatten().fieldErrors,
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        return new NextResponse<ErrorResponse>(
          JSON.stringify({
            error: {
              message: 'Unique constraint violation',
              code: 'UNIQUE_CONSTRAINT_ERROR',
              details: prismaError.meta,
            },
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      case 'P2025':
        return new NextResponse<ErrorResponse>(
          JSON.stringify({
            error: {
              message: 'Record not found',
              code: 'NOT_FOUND',
              details: prismaError.meta,
            },
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      default:
        return new NextResponse<ErrorResponse>(
          JSON.stringify({
            error: {
              message: 'Database error',
              code: 'DATABASE_ERROR',
              details: prismaError.meta,
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
    }
  }

  // Handle MongoDB errors
  if (error instanceof Error && error.name === 'MongoError') {
    const mongoError = error as any;
    switch (mongoError.code) {
      case 11000:
        return new NextResponse<ErrorResponse>(
          JSON.stringify({
            error: {
              message: 'Duplicate key error',
              code: 'DUPLICATE_KEY_ERROR',
              details: mongoError.keyValue,
            },
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      default:
        return new NextResponse<ErrorResponse>(
          JSON.stringify({
            error: {
              message: 'Database error',
              code: 'DATABASE_ERROR',
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
    }
  }

  // Handle JWT errors
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return new NextResponse<ErrorResponse>(
      JSON.stringify({
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle network errors
  if (error instanceof Error && error.name === 'NetworkError') {
    return new NextResponse<ErrorResponse>(
      JSON.stringify({
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
        },
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle rate limit errors
  if (error instanceof Error && error.name === 'RateLimitError') {
    return new NextResponse<ErrorResponse>(
      JSON.stringify({
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return new NextResponse<ErrorResponse>(
    JSON.stringify({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Helper function to create API errors
export function createApiError(
  statusCode: number,
  message: string,
  code?: string,
  details?: any
): ApiError {
  return new ApiError(statusCode, message, code, details);
}

// Common error creators
export const apiErrors = {
  notFound: (message = 'Resource not found') =>
    createApiError(404, message, 'NOT_FOUND'),

  unauthorized: (message = 'Unauthorized') =>
    createApiError(401, message, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    createApiError(403, message, 'FORBIDDEN'),

  badRequest: (message = 'Bad request', details?: any) =>
    createApiError(400, message, 'BAD_REQUEST', details),

  conflict: (message = 'Resource conflict', details?: any) =>
    createApiError(409, message, 'CONFLICT', details),

  tooManyRequests: (message = 'Too many requests') =>
    createApiError(429, message, 'RATE_LIMIT_EXCEEDED'),

  internal: (message = 'Internal server error', details?: any) =>
    createApiError(500, message, 'INTERNAL_SERVER_ERROR', details),
};

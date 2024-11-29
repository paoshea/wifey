export class GamificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GamificationError';
  }
}

export class ValidationError extends GamificationError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class UserProgressNotFoundError extends GamificationError {
  constructor(userId: string) {
    super(`User progress not found for user: ${userId}`, 'USER_PROGRESS_NOT_FOUND', 404);
    this.name = 'UserProgressNotFoundError';
  }
}

export class AchievementNotFoundError extends GamificationError {
  constructor(achievementId: string) {
    super(`Achievement not found: ${achievementId}`, 'ACHIEVEMENT_NOT_FOUND', 404);
    this.name = 'AchievementNotFoundError';
  }
}

export class DatabaseError extends GamificationError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

export class TransactionError extends GamificationError {
  constructor(message: string, details?: unknown) {
    super(message, 'TRANSACTION_ERROR', 500, details);
    this.name = 'TransactionError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

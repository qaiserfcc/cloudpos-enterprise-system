import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication specific errors
export class AuthError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 401, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}

export class ServerError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    requestId: (req as any).requestId,
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    error = new ValidationError(message, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthError(message, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthError(message, 'TOKEN_EXPIRED');
  }

  if ((err as any).code === '23505') { // PostgreSQL unique violation
    const message = 'Duplicate entry';
    error = new ConflictError(message, 'DUPLICATE_ENTRY');
  }

  if ((err as any).code === '23503') { // PostgreSQL foreign key violation
    const message = 'Reference constraint violation';
    error = new ValidationError(message, 'REFERENCE_ERROR');
  }

  // Handle operational vs programming errors
  if (error.isOperational) {
    // Operational errors - safe to send to client
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: (req as any).requestId
    });
  } else {
    // Programming errors - don't leak details
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: (req as any).requestId
    });
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
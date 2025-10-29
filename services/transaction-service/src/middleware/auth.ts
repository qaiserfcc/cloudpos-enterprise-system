import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { redisService } from '../services/redis';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    storeId: string;
    permissions: string[];
  };
}

// Authentication middleware to verify JWT tokens
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Call auth service to verify token
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${authServiceUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    const authResult: any = await response.json();
    if (!authResult.success || !authResult.valid) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Attach user info to request
    req.user = authResult.user;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
}

// Authorization middleware to check user roles and permissions
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

// Permission-based authorization
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

// Store access validation - ensure user can access the specified store
export function validateStoreAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const requestedStoreId = req.params.storeId || req.body.storeId;
  
  // Super admin can access any store
  if (req.user.role === 'super_admin') {
    next();
    return;
  }

  // Other users can only access their assigned store
  if (req.user.storeId !== requestedStoreId) {
    res.status(403).json({
      success: false,
      message: 'Access denied to this store'
    });
    return;
  }

  next();
}

// Rate limiting middleware using Redis
export async function createRateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100, // requests per window
  keyGenerator?: (req: Request) => string
) {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.userId || req.ip || 'unknown';
    }),
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
}

// Transaction-specific rate limits
export const transactionRateLimit = createRateLimit(
  60 * 1000, // 1 minute window
  10,        // 10 transactions per minute
  (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return `transaction:${authReq.user?.userId || req.ip}`;
  }
);

export const cartRateLimit = createRateLimit(
  60 * 1000, // 1 minute window
  30,        // 30 cart operations per minute
  (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return `cart:${authReq.user?.userId || req.ip}`;
  }
);

// Concurrent transaction protection
export async function preventConcurrentTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const lockKey = `transaction_lock:${req.user.userId}`;
  const lockAcquired = await redisService.acquireLock(lockKey, 30); // 30 second lock

  if (!lockAcquired) {
    res.status(429).json({
      success: false,
      message: 'Another transaction is in progress. Please wait.'
    });
    return;
  }

  // Add cleanup to release lock after response
  const originalSend = res.send;
  res.send = function(body) {
    redisService.releaseLock(lockKey).catch(error => {
      logger.error('Failed to release transaction lock', { error, userId: req.user?.userId });
    });
    return originalSend.call(this, body);
  };

  next();
}

// CORS middleware for transaction service
export function configureCORS(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}
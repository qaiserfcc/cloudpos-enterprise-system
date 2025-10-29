import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    storeId?: string;
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization header',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing authentication token',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        res.status(500).json({
          error: 'Server configuration error',
          message: 'Authentication service not properly configured',
          code: 'AUTH_CONFIG_ERROR'
        });
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Validate token structure
      if (!decoded.id || !decoded.email || !decoded.role || !decoded.tenantId) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Token missing required user information',
          code: 'TOKEN_INVALID'
        });
        return;
      }

      // Check token expiration (jwt.verify should handle this, but double-check)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      // Attach user information to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId,
        storeId: decoded.storeId,
        permissions: decoded.permissions || []
      };

      // Log successful authentication for audit
      logger.info(`User authenticated: ${decoded.email} (${decoded.role})`, {
        userId: decoded.id,
        tenantId: decoded.tenantId,
        storeId: decoded.storeId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Authentication token is invalid',
          code: 'TOKEN_INVALID'
        });
        return;
      }

      // Log unexpected JWT errors
      logger.error('JWT verification error', {
        error: jwtError,
        token: token.substring(0, 20) + '...', // Log partial token for debugging
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(401).json({
        error: 'Authentication failed',
        message: 'Could not verify authentication token',
        code: 'AUTH_VERIFICATION_FAILED'
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      error,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });

    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal authentication service error',
      code: 'AUTH_INTERNAL_ERROR'
    });
    return;
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No authentication provided, continue without user info
    next();
    return;
  }

  // If auth header is provided, validate it
  authMiddleware(req, res, next);
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email}: role ${req.user.role} not in ${allowedRoles.join(', ')}`, {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        endpoint: req.originalUrl,
        method: req.method
      });

      res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions for this resource',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      logger.warn(`Access denied for user ${req.user.email}: missing permission ${requiredPermission}`, {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermission,
        endpoint: req.originalUrl,
        method: req.method
      });

      res.status(403).json({
        error: 'Access denied',
        message: `Missing required permission: ${requiredPermission}`,
        code: 'MISSING_PERMISSION'
      });
      return;
    }

    next();
  };
};

export default authMiddleware;
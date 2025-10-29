import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    storeId?: string;
    permissions: string[];
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    const payload = await jwtService.verifyAccessToken(token);
    
    // Add user info to request object
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      storeId: payload.storeId,
      permissions: payload.permissions
    };

    next();

  } catch (error) {
    logger.warn('Token authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
}

export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE'
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!user.permissions.includes(permission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSION',
        required: permission
      });
      return;
    }

    next();
  };
}

export function requireStoreAccess(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;
  const storeId = req.params.storeId || req.body.storeId;

  if (!user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  // Super admins can access any store
  if (user.role === 'super_admin') {
    next();
    return;
  }

  // Check if user has access to the specific store
  if (user.storeId !== storeId) {
    res.status(403).json({
      error: 'Access denied to this store',
      code: 'STORE_ACCESS_DENIED'
    });
    return;
  }

  next();
}
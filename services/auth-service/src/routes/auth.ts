import { Router, Request, Response, NextFunction } from 'express';
import { authService, LoginCredentials, PasswordResetRequest, PasswordResetConfirm } from '../services/auth';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Registration endpoint
router.post('/register', validateRequest('register'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Rate limiting
    const clientIp = req.ip || 'unknown';
    const rateLimit = await authService.checkRateLimit(clientIp, 'register');
    if (!rateLimit.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter
      });
      return;
    }

    // Register user
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post('/login', validateRequest('login'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Rate limiting
    const clientIp = req.ip || 'unknown';
    const rateLimit = await authService.checkRateLimit(clientIp, 'login');
    if (!rateLimit.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter
      });
      return;
    }

    // Login
    const loginData: LoginCredentials = req.body;
    const result = await authService.login(loginData);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        requiresMFA: result.requiresMFA,
        mfaToken: result.mfaToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';
    const refreshToken = req.body.refreshToken;

    await authService.logout(accessToken, refreshToken);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    next(error);
  }
});

// Refresh tokens endpoint
router.post('/refresh', validateRequest('refresh'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
});

// Password reset request
router.post('/forgot-password', validateRequest('forgotPassword'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check rate limit
    const rateLimit = await authService.checkRateLimit(req.body.email, 'password_reset');
    if (!rateLimit.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many password reset attempts',
        retryAfter: rateLimit.retryAfter
      });
      return;
    }

    await authService.requestPasswordReset(req.body);
    
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    next(error);
  }
});

// Password reset confirmation
router.post('/reset-password', validateRequest('resetPassword'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.confirmPasswordReset(req.body);
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Verify token endpoint (for other services)
router.post('/verify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const result = await authService.validateToken(token);
    
    if (result.valid) {
      res.json({
        success: true,
        valid: true,
        user: result.payload
      });
    } else {
      res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await authService.getUserProfile(userId);
    
    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticateToken, validateRequest('changePassword'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
});

export default router;
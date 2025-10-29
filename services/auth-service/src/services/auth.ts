import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userService, User, CreateUserData } from './user';
import { jwtService, TokenPair } from './jwt';
import { redisService } from './redis';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: Omit<User, 'permissions'>;
  tokens: TokenPair;
  requiresMFA?: boolean;
  mfaToken?: string;
}

export interface RegisterData extends CreateUserData {
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

class AuthService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 900; // 15 minutes

  async register(registerData: RegisterData): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Validate passwords match
      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      this.validatePasswordStrength(registerData.password);

      // Create user
      const userData: CreateUserData = {
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phoneNumber: registerData.phoneNumber,
        role: registerData.role || 'cashier',
        storeId: registerData.storeId,
        permissions: registerData.permissions
      };

      const user = await userService.createUser(userData);

      // Generate tokens
      const tokens = await jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        permissions: user.permissions
      });

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Send verification email (implement later)
      // await this.sendVerificationEmail(user);

      return {
        user,
        tokens
      };

    } catch (error) {
      logger.error('Registration failed', { error, email: registerData.email });
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Check if account is locked
      const attempts = await redisService.getLoginAttempts(email);
      if (attempts >= this.maxLoginAttempts) {
        throw new Error('Account temporarily locked due to too many failed login attempts');
      }

      // Get user by email
      const user = await userService.getUserByEmail(email);
      if (!user) {
        await redisService.recordLoginAttempt(email, false);
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account has been deactivated');
      }

      // Validate password
      const isValidPassword = await userService.validatePassword(user.id, password);
      if (!isValidPassword) {
        await redisService.recordLoginAttempt(email, false);
        throw new Error('Invalid email or password');
      }

      // Clear failed login attempts
      await redisService.recordLoginAttempt(email, true);

      // Update last login
      await userService.updateLastLogin(user.id);

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '1d';
      const tokens = await jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        permissions: user.permissions
      });

      // Create session
      const sessionId = uuidv4();
      await redisService.setSession(sessionId, user.id, {
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
        rememberMe
      }, rememberMe ? 30 * 24 * 3600 : 24 * 3600);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        sessionId
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          storeId: user.storeId,
          isActive: user.isActive,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens
      };

    } catch (error) {
      logger.error('Login failed', { error, email: credentials.email });
      throw error;
    }
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Revoke access token
      await jwtService.revokeToken(accessToken, 'access');

      // Revoke refresh token if provided
      if (refreshToken) {
        await jwtService.revokeToken(refreshToken, 'refresh');
      }

      // Get user info from token to clean up session
      const tokenPayload = jwtService.decodeToken(accessToken);
      if (tokenPayload && tokenPayload.userId) {
        // Remove active sessions (you might want to keep session IDs in tokens for this)
        logger.info('User logged out successfully', { userId: tokenPayload.userId });
      }

    } catch (error) {
      logger.error('Logout failed', { error });
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      return await jwtService.refreshTokens(refreshToken);
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      const user = await userService.getUserByEmail(request.email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        logger.warn('Password reset requested for non-existent email', { email: request.email });
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetData = {
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString()
      };

      // Store reset token with 1 hour expiry
      await redisService.set(`password_reset:${resetToken}`, resetData, 3600);

      // Send password reset email (implement later)
      // await this.sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset requested', { userId: user.id, email: user.email });

    } catch (error) {
      logger.error('Password reset request failed', { error, email: request.email });
      throw error;
    }
  }

  async confirmPasswordReset(request: PasswordResetConfirm): Promise<void> {
    try {
      // Get reset data
      const resetData = await redisService.get(`password_reset:${request.token}`);
      if (!resetData) {
        throw new Error('Invalid or expired reset token');
      }

      // Validate new password
      this.validatePasswordStrength(request.newPassword);

      // Update password
      await userService.updatePassword(resetData.userId, request.newPassword);

      // Remove reset token
      await redisService.del(`password_reset:${request.token}`);

      // Revoke all user tokens for security
      await jwtService.revokeAllUserTokens(resetData.userId);

      logger.info('Password reset completed', { userId: resetData.userId });

    } catch (error) {
      logger.error('Password reset confirmation failed', { error });
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate current password
      const isValidPassword = await userService.validatePassword(userId, currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      this.validatePasswordStrength(newPassword);

      // Check if new password is different from current
      const isSamePassword = await userService.validatePassword(userId, newPassword);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      // Update password
      await userService.updatePassword(userId, newPassword);

      // Revoke all user tokens for security
      await jwtService.revokeAllUserTokens(userId);

      logger.info('Password changed successfully', { userId });

    } catch (error) {
      logger.error('Password change failed', { error, userId });
      throw error;
    }
  }

  async verifyUser(userId: string): Promise<void> {
    try {
      await userService.verifyUser(userId);
      logger.info('User verified successfully', { userId });
    } catch (error) {
      logger.error('User verification failed', { error, userId });
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Failed to get user profile', { error, userId });
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): Promise<User> {
    try {
      return await userService.updateUser(userId, updateData);
    } catch (error) {
      logger.error('Failed to update user profile', { error, userId });
      throw error;
    }
  }

  async validateToken(token: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const payload = await jwtService.verifyAccessToken(token);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character (@$!%*?&)');
    }
  }

  // Rate limiting check
  async checkRateLimit(identifier: string, action: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `rate_limit:${action}:${identifier}`;
    const limit = this.getRateLimitForAction(action);
    
    const result = await redisService.incrementRateLimit(key, limit.window, limit.max);
    
    return {
      allowed: !result.blocked,
      retryAfter: result.blocked ? result.ttl : undefined
    };
  }

  private getRateLimitForAction(action: string): { window: number; max: number } {
    const limits: { [key: string]: { window: number; max: number } } = {
      'login': { window: 900, max: 5 }, // 5 attempts per 15 minutes
      'register': { window: 3600, max: 3 }, // 3 attempts per hour
      'password_reset': { window: 3600, max: 3 }, // 3 attempts per hour
      'password_change': { window: 900, max: 3 } // 3 attempts per 15 minutes
    };

    return limits[action] || { window: 3600, max: 10 };
  }
}

export const authService = new AuthService();
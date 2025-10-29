import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisService } from './redis';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  storeId?: string;
  permissions: string[];
  tokenId: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn('JWT secrets not set in environment variables. Using default values.');
    }
  }

  async generateTokenPair(payload: Omit<TokenPayload, 'tokenId' | 'type'>): Promise<TokenPair> {
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    const accessPayload: TokenPayload = {
      ...payload,
      tokenId: accessTokenId,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      ...payload,
      tokenId: refreshTokenId,
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      accessPayload, 
      this.accessTokenSecret, 
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'cloudpos-auth',
        audience: 'cloudpos-api',
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload, 
      this.refreshTokenSecret, 
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'cloudpos-auth',
        audience: 'cloudpos-api',
      } as jwt.SignOptions
    );

    // Store refresh token in Redis for validation
    const refreshTTL = this.getExpiryInSeconds(this.refreshTokenExpiry);
    await redisService.set(`refresh_token:${refreshTokenId}`, {
      userId: payload.userId,
      tokenId: refreshTokenId,
      createdAt: new Date().toISOString(),
    }, refreshTTL);

    logger.info('Token pair generated', {
      userId: payload.userId,
      accessTokenId,
      refreshTokenId,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryInSeconds(this.accessTokenExpiry),
      refreshExpiresIn: refreshTTL,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redisService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'cloudpos-auth',
        audience: 'cloudpos-api',
      }) as TokenPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      logger.warn('Access token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenPrefix: token.substring(0, 10),
      });
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'cloudpos-auth',
        audience: 'cloudpos-api',
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const storedToken = await redisService.get(`refresh_token:${payload.tokenId}`);
      if (!storedToken || storedToken.userId !== payload.userId) {
        throw new Error('Refresh token not found or invalid');
      }

      return payload;
    } catch (error) {
      logger.warn('Refresh token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenPrefix: token.substring(0, 10),
      });
      throw new Error('Invalid or expired refresh token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      // Revoke old refresh token
      await redisService.del(`refresh_token:${payload.tokenId}`);

      // Generate new token pair
      const newTokenPair = await this.generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        storeId: payload.storeId,
        permissions: payload.permissions,
      });

      logger.info('Tokens refreshed', { userId: payload.userId });

      return newTokenPair;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw new Error('Failed to refresh tokens');
    }
  }

  async revokeToken(token: string, type: 'access' | 'refresh'): Promise<void> {
    try {
      const secret = type === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;
      const payload = jwt.verify(token, secret) as TokenPayload;

      if (type === 'access') {
        // Add access token to blacklist
        const expiry = this.getExpiryInSeconds(this.accessTokenExpiry);
        await redisService.blacklistToken(token, expiry);
      } else {
        // Remove refresh token from Redis
        await redisService.del(`refresh_token:${payload.tokenId}`);
      }

      logger.info('Token revoked', {
        type,
        userId: payload.userId,
        tokenId: payload.tokenId,
      });
    } catch (error) {
      logger.error('Token revocation failed', { error, type });
      throw new Error('Failed to revoke token');
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all refresh tokens for the user and revoke them
      const keys = await redisService.getKeys('refresh_token:*');
      
      for (const key of keys) {
        const tokenData = await redisService.get(key);
        if (tokenData && tokenData.userId === userId) {
          await redisService.del(key);
        }
      }

      logger.info('All user tokens revoked', { userId });
    } catch (error) {
      logger.error('Failed to revoke all user tokens', { error, userId });
      throw new Error('Failed to revoke all tokens');
    }
  }

  private getExpiryInSeconds(expiry: string): number {
    const timeMap: { [key: string]: number } = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * timeMap[unit];
  }

  // Utility method to decode token without verification (for logging/debugging)
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

export const jwtService = new JWTService();
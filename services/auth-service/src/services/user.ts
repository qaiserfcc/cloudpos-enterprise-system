import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './database';
import { redisService } from './redis';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  storeId?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  storeId?: string;
  permissions?: string[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  storeId?: string;
  isActive?: boolean;
  permissions?: string[];
}

class UserService {
  private readonly saltRounds = 12;

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
      
      // Generate user ID
      const userId = uuidv4();
      
      // Default permissions based on role
      const permissions = userData.permissions || this.getDefaultPermissions(userData.role);

      const query = `
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, phone_number,
          role, store_id, is_active, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, email, first_name, last_name, phone_number, role, 
                  store_id, is_active, is_verified, created_at, updated_at
      `;

      const values = [
        userId,
        userData.email.toLowerCase(),
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.role,
        userData.storeId,
        true, // is_active
        false, // is_verified
        new Date(),
        new Date()
      ];

      const result = await dbService.query(query, values);
      const user = result.rows[0];

      // Insert user permissions
      if (permissions.length > 0) {
        await this.updateUserPermissions(userId, permissions);
      }

      // Cache user data
      await redisService.set(`user:${userId}`, { ...user, permissions }, 3600); // 1 hour cache

      logger.info('User created successfully', {
        userId,
        email: userData.email,
        role: userData.role
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        storeId: user.store_id,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        permissions
      };

    } catch (error) {
      logger.error('Failed to create user', { error, email: userData.email });
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try cache first
      const cachedUser = await redisService.get(`user:${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number,
               u.role, u.store_id, u.is_active, u.is_verified,
               u.last_login_at, u.created_at, u.updated_at,
               COALESCE(array_agg(up.permission) FILTER (WHERE up.permission IS NOT NULL), '{}') as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.id = $1
        GROUP BY u.id
      `;

      const result = await dbService.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phoneNumber: row.phone_number,
        role: row.role,
        storeId: row.store_id,
        isActive: row.is_active,
        isVerified: row.is_verified,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        permissions: row.permissions
      };

      // Cache the user
      await redisService.set(`user:${userId}`, user, 3600);

      return user;

    } catch (error) {
      logger.error('Failed to get user by ID', { error, userId });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number,
               u.role, u.store_id, u.is_active, u.is_verified,
               u.last_login_at, u.created_at, u.updated_at,
               COALESCE(array_agg(up.permission) FILTER (WHERE up.permission IS NOT NULL), '{}') as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.email = $1
        GROUP BY u.id
      `;

      const result = await dbService.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phoneNumber: row.phone_number,
        role: row.role,
        storeId: row.store_id,
        isActive: row.is_active,
        isVerified: row.is_verified,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        permissions: row.permissions
      };

    } catch (error) {
      logger.error('Failed to get user by email', { error, email });
      throw error;
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'permissions') {
          const dbKey = key === 'firstName' ? 'first_name' :
                       key === 'lastName' ? 'last_name' :
                       key === 'phoneNumber' ? 'phone_number' :
                       key === 'storeId' ? 'store_id' :
                       key === 'isActive' ? 'is_active' : key;
          
          setClauses.push(`${dbKey} = $${paramCounter}`);
          values.push(value);
          paramCounter++;
        }
      });

      if (setClauses.length === 0 && !updateData.permissions) {
        throw new Error('No valid fields to update');
      }

      if (setClauses.length > 0) {
        setClauses.push(`updated_at = $${paramCounter}`);
        values.push(new Date());
        values.push(userId);

        const query = `
          UPDATE users 
          SET ${setClauses.join(', ')}
          WHERE id = $${paramCounter + 1}
          RETURNING id, email, first_name, last_name, phone_number, role,
                    store_id, is_active, is_verified, last_login_at, created_at, updated_at
        `;

        await dbService.query(query, values);
      }

      // Update permissions if provided
      if (updateData.permissions) {
        await this.updateUserPermissions(userId, updateData.permissions);
      }

      // Clear cache and return updated user
      await redisService.del(`user:${userId}`);
      const updatedUser = await this.getUserById(userId);
      
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      logger.info('User updated successfully', { userId });
      return updatedUser;

    } catch (error) {
      logger.error('Failed to update user', { error, userId });
      throw error;
    }
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const query = 'SELECT password_hash FROM users WHERE id = $1';
      const result = await dbService.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }

      return await bcrypt.compare(password, result.rows[0].password_hash);

    } catch (error) {
      logger.error('Failed to validate password', { error, userId });
      return false;
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = $2 
        WHERE id = $3
      `;

      await dbService.query(query, [hashedPassword, new Date(), userId]);

      logger.info('Password updated successfully', { userId });

    } catch (error) {
      logger.error('Failed to update password', { error, userId });
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET last_login_at = $1 
        WHERE id = $2
      `;

      await dbService.query(query, [new Date(), userId]);

    } catch (error) {
      logger.error('Failed to update last login', { error, userId });
    }
  }

  async verifyUser(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET is_verified = true, updated_at = $1 
        WHERE id = $2
      `;

      await dbService.query(query, [new Date(), userId]);

      // Clear cache
      await redisService.del(`user:${userId}`);

      logger.info('User verified successfully', { userId });

    } catch (error) {
      logger.error('Failed to verify user', { error, userId });
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = $1 
        WHERE id = $2
      `;

      await dbService.query(query, [new Date(), userId]);

      // Clear cache
      await redisService.del(`user:${userId}`);

      logger.info('User deactivated successfully', { userId });

    } catch (error) {
      logger.error('Failed to deactivate user', { error, userId });
      throw error;
    }
  }

  private async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await dbService.transaction(async (client) => {
      // Remove existing permissions
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

      // Insert new permissions
      if (permissions.length > 0) {
        const values = permissions.map((permission, index) => 
          `($1, $${index + 2})`
        ).join(', ');

        const insertQuery = `
          INSERT INTO user_permissions (user_id, permission) 
          VALUES ${values}
        `;

        await client.query(insertQuery, [userId, ...permissions]);
      }
    });
  }

  private getDefaultPermissions(role: string): string[] {
    const rolePermissions: { [key: string]: string[] } = {
      'super_admin': [
        'users:read', 'users:write', 'users:delete',
        'stores:read', 'stores:write', 'stores:delete',
        'products:read', 'products:write', 'products:delete',
        'transactions:read', 'transactions:write',
        'payments:read', 'payments:write',
        'reports:read', 'settings:read', 'settings:write'
      ],
      'store_admin': [
        'users:read', 'users:write',
        'products:read', 'products:write',
        'transactions:read', 'transactions:write',
        'payments:read', 'payments:write',
        'reports:read'
      ],
      'cashier': [
        'products:read',
        'transactions:read', 'transactions:write',
        'payments:read', 'payments:write'
      ],
      'inventory_manager': [
        'products:read', 'products:write',
        'transactions:read',
        'reports:read'
      ]
    };

    return rolePermissions[role] || [];
  }
}

export const userService = new UserService();
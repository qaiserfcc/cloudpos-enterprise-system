import validator from 'validator';
import { ApiError } from '@shared/types';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    return validator.isMobilePhone(phone, 'any', { strictMode: false });
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    return validator.isUUID(uuid);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return validator.escape(input.trim());
  }

  /**
   * Validate SKU format (alphanumeric with hyphens and underscores)
   */
  static isValidSKU(sku: string): boolean {
    return /^[A-Za-z0-9_-]+$/.test(sku);
  }

  /**
   * Validate price format (positive number with up to 2 decimal places)
   */
  static isValidPrice(price: number): boolean {
    return price >= 0 && Number.isFinite(price) && Math.round(price * 100) === price * 100;
  }

  /**
   * Validate quantity (positive integer)
   */
  static isValidQuantity(quantity: number): boolean {
    return Number.isInteger(quantity) && quantity >= 0;
  }

  /**
   * Create validation error
   */
  static createValidationError(message: string, field?: string): ApiError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      details: field ? { field } : undefined
    };
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[]
  ): string[] {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  /**
   * Validate object schema
   */
  static validateSchema<T>(
    data: any,
    schema: Record<keyof T, (value: any) => boolean>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [field, validator] of Object.entries(schema)) {
      if (data[field] !== undefined && typeof validator === 'function' && !validator(data[field])) {
        errors.push(`Invalid ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ValidationUtils;
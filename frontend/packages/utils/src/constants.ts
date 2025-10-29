// API Constants
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  CUSTOMERS: '/customers',
  SALES: '/sales',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
} as const;

// UI Constants
export const COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  DIGITAL_WALLET: 'digital_wallet',
  STORE_CREDIT: 'store_credit',
} as const;

// Sale Status
export const SALE_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  VOIDED: 'voided',
  RETURNED: 'returned',
} as const;

// Report Types
export const REPORT_TYPES = {
  SALES: 'sales',
  INVENTORY: 'inventory',
  CUSTOMER: 'customer',
  FINANCIAL: 'financial',
  PERFORMANCE: 'performance',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cloudpos_auth_token',
  USER_PREFERENCES: 'cloudpos_user_preferences',
  THEME: 'cloudpos_theme',
  LANGUAGE: 'cloudpos_language',
  CART: 'cloudpos_cart',
} as const;

// Theme Constants
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// Form Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime-local',
  FILE: 'file',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENTS: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(\d{3}\) \d{3}-\d{4}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  SKU: /^[a-zA-Z0-9_-]+$/,
  BARCODE: /^\d{8,18}$/,
  POSTAL_CODE: /^\d{5}(-\d{4})?$/,
  CREDIT_CARD: /^\d{13,19}$/,
} as const;
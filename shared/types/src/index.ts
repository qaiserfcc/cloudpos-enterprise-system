// Base Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantEntity extends BaseEntity {
  tenantId: string;
}

// User Types
export interface User extends TenantEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: UserRole[];
  permissions: Permission[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  storeIds: string[];
}

export interface Permission {
  resource: string;
  actions: Action[];
  constraints?: PermissionConstraint[];
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute'
}

export interface PermissionConstraint {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

// Tenant Types
export interface Tenant extends BaseEntity {
  name: string;
  domain: string;
  subscriptionPlan: string;
  settings: Record<string, any>;
  isActive: boolean;
}

// Store Types
export interface Store extends TenantEntity {
  name: string;
  code: string;
  address: Address;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  taxRate: number;
  settings: Record<string, any>;
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Product Types
export interface Product extends TenantEntity {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  basePrice: number;
  costPrice?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  images: string[];
  variants: ProductVariant[];
  attributes: Record<string, any>;
  isTrackable: boolean;
  isActive: boolean;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, string>;
}

export interface ProductCategory extends TenantEntity {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

// Inventory Types
export interface Inventory extends BaseEntity {
  productId: string;
  storeId: string;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  maxStock?: number;
  costPrice?: number;
  lastCostUpdate?: Date;
  lastCountDate?: Date;
}

export interface StockMovement extends BaseEntity {
  inventoryId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  employeeId?: string;
}

export enum MovementType {
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  PURCHASE = 'purchase',
  DAMAGE = 'damage'
}

// Transaction Types
export interface Transaction extends TenantEntity {
  storeId: string;
  terminalId?: string;
  employeeId?: string;
  customerId?: string;
  receiptNumber: string;
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  payments: Payment[];
  status: TransactionStatus;
  notes?: string;
  metadata: Record<string, any>;
  completedAt?: Date;
}

export interface TransactionItem extends BaseEntity {
  transactionId: string;
  productId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
  costPrice?: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

// Payment Types
export interface Payment extends BaseEntity {
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  processedAt?: Date;
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTOCURRENCY = 'cryptocurrency',
  GIFT_CARD = 'gift_card',
  LOYALTY_POINTS = 'loyalty_points'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Customer Types
export interface Customer extends TenantEntity {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  addresses: Address[];
  preferences: CustomerPreferences;
  loyaltyMembership?: LoyaltyMembership;
  totalSpent: number;
  totalVisits: number;
  lastVisit?: Date;
  isActive: boolean;
}

export interface CustomerPreferences {
  communicationChannels: ('email' | 'sms' | 'push')[];
  categories: string[];
  brands: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface LoyaltyMembership {
  id: string;
  programId: string;
  membershipNumber: string;
  pointsBalance: number;
  lifetimePoints: number;
  tierLevel: string;
  joinDate: Date;
  lastActivity?: Date;
  isActive: boolean;
}

export interface LoyaltyProgram extends TenantEntity {
  name: string;
  description?: string;
  pointsPerDollar: number;
  dollarPerPoint: number;
  minimumPointsRedemption: number;
  expiryMonths?: number;
  tiers: LoyaltyTier[];
  rules: Record<string, any>;
  isActive: boolean;
}

export interface LoyaltyTier {
  name: string;
  minimumPoints: number;
  benefits: string[];
  multiplier: number;
}

// Notification Types
export interface NotificationTemplate extends TenantEntity {
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
}

export enum NotificationType {
  TRANSACTION_ALERT = 'transaction_alert',
  INVENTORY_ALERT = 'inventory_alert',
  SYSTEM_ALERT = 'system_alert',
  MARKETING = 'marketing',
  RECEIPT = 'receipt'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  defaultValue?: any;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

// Report Types
export interface ReportRequest {
  type: ReportType;
  dateRange: DateRange;
  storeIds?: string[];
  filters?: Record<string, any>;
  format: ReportFormat;
}

export enum ReportType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  FINANCIAL = 'financial',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XLSX = 'xlsx'
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Event Types for Message Queue
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, any>;
  metadata: EventMetadata;
  occurredAt: Date;
}

export interface EventMetadata {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  causationId?: string;
  version: number;
}

// Health Check Types
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheck[];
  duration: number;
  timestamp: Date;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  description?: string;
  duration: number;
  data?: Record<string, any>;
}
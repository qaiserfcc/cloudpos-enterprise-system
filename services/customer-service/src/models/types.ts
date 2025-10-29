import { Decimal } from 'decimal.js';

// Core Customer Types
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked'
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  VIP = 'vip',
  CORPORATE = 'corporate'
}

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export enum ContactPreference {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  PUSH = 'push',
  NONE = 'none'
}

export enum CustomerSegment {
  NEW = 'new',
  REGULAR = 'regular',
  FREQUENT = 'frequent',
  VIP = 'vip',
  CHURNED = 'churned',
  HIGH_VALUE = 'high_value',
  LOW_VALUE = 'low_value'
}

// Main Customer Interface
export interface Customer {
  id: string;
  storeId: string;
  customerNumber: string; // Unique customer identifier
  type: CustomerType;
  status: CustomerStatus;
  
  // Personal Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  
  // Business Information (for business customers)
  companyName?: string;
  taxId?: string;
  businessType?: string;
  
  // Address Information
  addresses: CustomerAddress[];
  
  // Preferences
  preferences: CustomerPreferences;
  
  // Loyalty Information
  loyaltyProgram?: CustomerLoyalty;
  
  // Analytics
  analytics: CustomerAnalytics;
  
  // Metadata
  tags: string[];
  notes: string;
  customFields: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastVisitAt?: Date;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: 'billing' | 'shipping' | 'home' | 'work';
  isDefault: boolean;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPreferences {
  id: string;
  customerId: string;
  contactMethod: ContactPreference;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  pushNotificationsOptIn: boolean;
  language: string;
  currency: string;
  timezone: string;
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  programId: string;
  tier: LoyaltyTier;
  points: Decimal;
  totalPointsEarned: Decimal;
  totalPointsRedeemed: Decimal;
  joinedAt: Date;
  expiresAt?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAnalytics {
  id: string;
  customerId: string;
  segment: CustomerSegment;
  
  // Transaction Analytics
  totalTransactions: number;
  totalSpent: Decimal;
  averageOrderValue: Decimal;
  lastPurchaseAmount: Decimal;
  
  // Visit Analytics
  totalVisits: number;
  averageVisitsPerMonth: Decimal;
  daysSinceLastVisit: number;
  
  // Product Analytics
  favoriteCategory?: string;
  favoriteProduct?: string;
  mostPurchasedProducts: string[];
  
  // Behavior Analytics
  averageSessionDuration: number; // in minutes
  preferredShoppingTime: string; // e.g., "morning", "afternoon", "evening"
  preferredShoppingDay: string; // e.g., "monday", "weekend"
  
  // Engagement Analytics
  emailOpenRate: Decimal;
  smsClickRate: Decimal;
  loyaltyEngagement: Decimal;
  
  // Risk Analytics
  churnRisk: 'low' | 'medium' | 'high';
  lifetimeValue: Decimal;
  predictedValue: Decimal;
  
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Loyalty Program Types
export interface LoyaltyProgram {
  id: string;
  storeId: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Point System
  pointsPerDollar: Decimal;
  minimumPointsToRedeem: number;
  pointValue: Decimal; // How much 1 point is worth in dollars
  pointsExpirationDays?: number;
  
  // Tier System
  tiers: LoyaltyTier[];
  tierRequirements: Record<LoyaltyTier, LoyaltyTierRequirement>;
  
  // Rules
  rules: LoyaltyRule[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTierRequirement {
  tier: LoyaltyTier;
  minimumSpent?: Decimal;
  minimumTransactions?: number;
  minimumPoints?: number;
  benefits: string[];
  multiplier: Decimal; // Points multiplier for this tier
}

export interface LoyaltyRule {
  id: string;
  programId: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Conditions
  conditions: LoyaltyCondition[];
  
  // Actions
  pointsAwarded?: number;
  multiplier?: Decimal;
  bonusType?: 'fixed' | 'percentage';
  bonusValue?: Decimal;
  
  // Validity
  validFrom?: Date;
  validTo?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyCondition {
  type: 'product' | 'category' | 'amount' | 'quantity' | 'date' | 'time';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  programId: string;
  transactionId?: string; // Reference to actual purchase transaction
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: Decimal;
  description: string;
  reference?: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Purchase History Types
export interface CustomerPurchaseHistory {
  customerId: string;
  transactions: CustomerTransaction[];
  summary: PurchaseHistorySummary;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  storeId: string;
  transactionNumber: string;
  total: Decimal;
  subtotal: Decimal;
  tax: Decimal;
  discount: Decimal;
  currency: string;
  paymentMethod: string;
  status: string;
  items: CustomerTransactionItem[];
  createdAt: Date;
}

export interface CustomerTransactionItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  category: string;
}

export interface PurchaseHistorySummary {
  totalTransactions: number;
  totalSpent: Decimal;
  averageOrderValue: Decimal;
  topCategories: Array<{
    category: string;
    count: number;
    total: Decimal;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    total: Decimal;
  }>;
  monthlySpending: Array<{
    month: string;
    total: Decimal;
    transactions: number;
  }>;
}

// Marketing and Segmentation Types
export interface CustomerSegmentRule {
  id: string;
  storeId: string;
  name: string;
  description: string;
  segment: CustomerSegment;
  isActive: boolean;
  
  // Criteria
  criteria: SegmentCriteria[];
  
  // Auto-assignment
  autoAssign: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  field: string; // e.g., 'totalSpent', 'lastVisitDays', 'transactionCount'
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  value2?: any;
}

export interface MarketingCampaign {
  id: string;
  storeId: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'direct_mail';
  
  // Targeting
  targetSegments: CustomerSegment[];
  targetCustomers?: string[]; // Specific customer IDs
  
  // Content
  subject?: string;
  content: string;
  templateId?: string;
  
  // Scheduling
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  
  // Results
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// DTOs and Request/Response Types
export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type?: CustomerType;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  companyName?: string;
  taxId?: string;
  address?: Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;
  preferences?: Partial<Omit<CustomerPreferences, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  companyName?: string;
  taxId?: string;
  status?: CustomerStatus;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
}

export interface CustomerSearchQuery {
  storeId?: string;
  query?: string; // Search in name, email, phone
  status?: CustomerStatus;
  type?: CustomerType;
  segment?: CustomerSegment;
  tier?: LoyaltyTier;
  tags?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
  totalSpentMin?: number;
  totalSpentMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastVisitAt' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}

export interface LoyaltyPointsDto {
  customerId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'adjusted';
  description: string;
  reference?: string;
  transactionId?: string;
}

export interface CustomerStatsResponse {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  customerGrowthRate: Decimal;
  averageLifetimeValue: Decimal;
  topSpenders: Array<{
    customerId: string;
    name: string;
    totalSpent: Decimal;
  }>;
  segmentDistribution: Record<CustomerSegment, number>;
  tierDistribution: Record<LoyaltyTier, number>;
}

// Events and Webhooks
export interface CustomerEvent {
  id: string;
  customerId: string;
  storeId: string;
  type: 'created' | 'updated' | 'purchased' | 'visited' | 'loyalty_earned' | 'loyalty_redeemed';
  data: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CustomerWebhook {
  id: string;
  storeId: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  createdAt: Date;
  updatedAt: Date;
}
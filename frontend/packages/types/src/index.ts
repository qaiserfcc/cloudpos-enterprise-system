export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// Purchase order status
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

// Stock movement types
export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expired';

// Supplier interface
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: string;
  taxId?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// Purchase order item
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
}

// Purchase order interface
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping?: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Stock movement interface
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string; // PO number, sale ID, etc.
  location?: string;
  createdBy: string;
  createdAt: string;
}

// Inventory alert interface
export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon';
  currentStock: number;
  threshold?: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

// Product interface with comprehensive details
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  categoryId: string;
  price: number;
  salePrice?: number;
  cost: number;
  stock: number;
  stockStatus: StockStatus;
  minStock: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  unit: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  status: ProductStatus;
  taxRate?: number;
  supplier?: {
    id: string;
    name: string;
    contactInfo: string;
  };
  tags?: string[];
  expiryDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  birthDate?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  averageOrderValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Sale {
  id: string;
  transactionNumber: string;
  customerId?: string;
  cashierId: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Inventory {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastStockUpdate: string;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description?: string;
  data: Record<string, any>;
  generatedAt: string;
  generatedBy: string;
  parameters: Record<string, any>;
}

export type OrderPaymentMethod = 'cash' | 'card' | 'digital_wallet' | 'store_credit';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SaleStatus = 'draft' | 'completed' | 'voided' | 'returned';
export type ReportType = 'sales' | 'inventory' | 'customer' | 'financial' | 'performance';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => any;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: any;
  path?: string;
  children?: NavigationItem[];
  permissions?: string[];
  badge?: string | number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: number;
}

export interface NotificationConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  autoHide?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary';
}

// Employee Management Types
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  position: EmployeePosition;
  department: Department;
  role: EmployeeRole;
  permissions: EmployeePermission[];
  salary?: number;
  hourlyRate?: number;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  emergencyContact?: EmergencyContact;
  schedule?: EmployeeSchedule;
  performanceRating?: number;
  notes?: string;
  managerId?: string;
  manager?: Employee;
  storeId?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePosition {
  id: string;
  title: string;
  description?: string;
  level: PositionLevel;
  departmentId: string;
  baseSalary?: number;
  baseHourlyRate?: number;
  isActive: boolean;
}

export type PositionLevel = 'entry' | 'junior' | 'senior' | 'lead' | 'manager' | 'director';

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  manager?: Employee;
  costCenter?: string;
  budget?: number;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeRole = 'admin' | 'manager' | 'supervisor' | 'cashier' | 'stock_clerk' | 'sales_associate' | 'customer_service';

export interface EmployeePermission {
  id: string;
  name: string;
  description?: string;
  module: PermissionModule;
  actions: PermissionAction[];
}

export type PermissionModule = 'products' | 'inventory' | 'sales' | 'customers' | 'employees' | 'reports' | 'settings' | 'suppliers';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  workDays: WorkDay[];
  effectiveFrom: string;
  effectiveTo?: string;
  hoursPerWeek: number;
}

export interface WorkDay {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isWorkingDay: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Timesheet {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  regularHours?: number;
  overtimeHours?: number;
  status: TimesheetStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export type TimesheetStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: Employee;
  reviewerId: string;
  reviewer?: Employee;
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  overallRating: number;
  categories: PerformanceCategory[];
  goals: PerformanceGoal[];
  achievements: string[];
  areasForImprovement: string[];
  comments?: string;
  status: ReviewStatus;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PerformanceCategory {
  name: string;
  rating: number;
  maxRating: number;
  weight: number;
  comments?: string;
}

export interface PerformanceGoal {
  id: string;
  description: string;
  targetDate: string;
  status: GoalStatus;
  progress: number;
  completionNotes?: string;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type ReviewStatus = 'draft' | 'pending' | 'completed';

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
  approvedBy?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'sick' | 'vacation' | 'holiday';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  approverId?: string;
  approver?: Employee;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'emergency' | 'bereavement' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  createdBy: string;
  createdAt: string;
  processedAt?: string;
}

export type PayrollStatus = 'draft' | 'processing' | 'approved' | 'paid';

export interface EmployeePayroll {
  id: string;
  employeeId: string;
  employee?: Employee;
  payrollPeriodId: string;
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeRate: number;
  grossPay: number;
  deductions: PayrollDeduction[];
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
}

export interface PayrollDeduction {
  type: DeductionType;
  name: string;
  amount: number;
  isPreTax: boolean;
}

export type DeductionType = 'tax' | 'insurance' | 'retirement' | 'union_dues' | 'other';

// Enhanced Supplier Management Types
export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierContract {
  id: string;
  supplierId: string;
  contractNumber: string;
  startDate: string;
  endDate?: string;
  terms: string;
  paymentTerms: PaymentTerms;
  deliveryTerms?: string;
  minimumOrderValue?: number;
  discountPercentage?: number;
  penaltyClause?: string;
  renewalTerms?: string;
  status: ContractStatus;
  documentUrl?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export interface PaymentTerms {
  type: PaymentTermType;
  daysNet?: number;
  discountPercentage?: number;
  discountDays?: number;
  description: string;
}

export type PaymentTermType = 'cash_on_delivery' | 'net_days' | 'end_of_month' | 'cash_in_advance' | 'consignment';

export interface SupplierPerformance {
  id: string;
  supplierId: string;
  evaluationPeriod: {
    startDate: string;
    endDate: string;
  };
  qualityRating: number;
  deliveryRating: number;
  serviceRating: number;
  priceRating: number;
  overallRating: number;
  totalOrders: number;
  onTimeDeliveries: number;
  qualityIssues: number;
  averageDeliveryDays: number;
  totalOrderValue: number;
  returnedItems: number;
  comments?: string;
  evaluatedBy: string;
  evaluatedAt: string;
  createdAt: string;
}

export interface SupplierCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  supplierCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDocument {
  id: string;
  supplierId: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadedAt: string;
  expiryDate?: string;
}

// Tax Configuration Types
export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage (e.g., 8.5 for 8.5%)
  type: 'percentage' | 'fixed';
  category: TaxCategory;
  jurisdiction: 'federal' | 'state' | 'local' | 'city';
  location?: {
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
  };
  isActive: boolean;
  isDefault: boolean;
  validFrom: string;
  validTo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCategory {
  id: string;
  name: string;
  description?: string;
  defaultRate?: number;
  isActive: boolean;
  applicableProducts: string[]; // product category IDs
  exemptions?: TaxExemption[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxExemption {
  id: string;
  name: string;
  type: 'customer_type' | 'product_type' | 'amount_threshold' | 'date_range';
  conditions: {
    customerTypes?: string[];
    productCategories?: string[];
    minimumAmount?: number;
    maximumAmount?: number;
    startDate?: string;
    endDate?: string;
  };
  exemptionType: 'full' | 'partial';
  exemptionValue?: number; // for partial exemptions
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  priority: number; // lower number = higher priority
  conditions: TaxRuleCondition[];
  actions: TaxRuleAction[];
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRuleCondition {
  field: 'customer_type' | 'product_category' | 'order_amount' | 'location' | 'date';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
}

export interface TaxRuleAction {
  type: 'apply_rate' | 'apply_exemption' | 'apply_additional_tax' | 'modify_rate';
  taxRateId?: string;
  exemptionId?: string;
  rateModifier?: number; // percentage to add/subtract
}

export interface TaxCalculation {
  id: string;
  orderId?: string;
  subtotal: number;
  taxBreakdown: TaxBreakdownItem[];
  totalTax: number;
  total: number;
  appliedRules: string[]; // tax rule IDs
  calculatedAt: string;
}

export interface TaxBreakdownItem {
  taxRateId: string;
  taxRateName: string;
  taxType: 'percentage' | 'fixed';
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  jurisdiction: string;
}

export interface TaxReport {
  id: string;
  reportType: 'sales_tax' | 'vat' | 'gst' | 'income_tax';
  period: {
    startDate: string;
    endDate: string;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  summary: {
    totalSales: number;
    totalTaxCollected: number;
    totalTaxOwed: number;
    totalExemptions: number;
  };
  breakdown: TaxReportBreakdown[];
  generatedAt: string;
  generatedBy: string;
  status: 'draft' | 'finalized' | 'submitted';
}

export interface TaxReportBreakdown {
  taxRateId: string;
  taxRateName: string;
  jurisdiction: string;
  taxableAmount: number;
  taxCollected: number;
  transactionCount: number;
}

export interface TaxConfiguration {
  id: string;
  storeId: string;
  generalSettings: {
    includeTaxInPrices: boolean;
    roundingMethod: 'round' | 'floor' | 'ceil';
    roundingPrecision: number; // decimal places
    displayTaxSeparately: boolean;
    requireTaxExemptionNumber: boolean;
  };
  defaultRates: {
    salesTaxRateId?: string;
    vatRateId?: string;
    gstRateId?: string;
  };
  automationRules: {
    autoCalculateTax: boolean;
    autoApplyExemptions: boolean;
    validateTaxNumbers: boolean;
  };
  complianceSettings: {
    enableAuditTrail: boolean;
    retainRecordsMonths: number;
    requireManagerApprovalForExemptions: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

// Payment Processing Types
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  isDefault: boolean;
  configuration: PaymentMethodConfiguration;
  fees: PaymentFee[];
  limits: PaymentLimits;
  acceptedCurrencies: string[];
  processingTime: string; // e.g., "instant", "1-3 business days"
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethodType = 
  | 'cash' 
  | 'credit_card' 
  | 'debit_card' 
  | 'mobile_payment' 
  | 'digital_wallet' 
  | 'bank_transfer' 
  | 'check' 
  | 'gift_card' 
  | 'loyalty_points' 
  | 'cryptocurrency';

export interface PaymentMethodConfiguration {
  requireSignature?: boolean;
  requirePIN?: boolean;
  allowTip?: boolean;
  allowPartialPayment?: boolean;
  requireCustomerVerification?: boolean;
  gatewaySettings?: PaymentGatewaySettings;
  terminalSettings?: PaymentTerminalSettings;
}

export interface PaymentGatewaySettings {
  provider: PaymentProvider;
  merchantId: string;
  apiKey: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
  supportedFeatures: PaymentFeature[];
}

export type PaymentProvider = 
  | 'stripe' 
  | 'square' 
  | 'paypal' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'samsung_pay' 
  | 'venmo' 
  | 'zelle' 
  | 'cashapp';

export type PaymentFeature = 
  | 'recurring_payments' 
  | 'refunds' 
  | 'partial_refunds' 
  | 'chargebacks' 
  | 'tokenization' 
  | 'fraud_detection' 
  | 'risk_management';

export interface PaymentTerminalSettings {
  terminalId: string;
  terminalType: 'physical' | 'virtual' | 'mobile';
  connectionType: 'bluetooth' | 'usb' | 'ethernet' | 'wifi';
  encryptionLevel: 'end_to_end' | 'point_to_point' | 'basic';
  complianceLevel: PaymentComplianceLevel[];
}

export type PaymentComplianceLevel = 'pci_dss' | 'emv' | 'contactless' | 'chip_and_pin';

export interface PaymentFee {
  id: string;
  type: PaymentFeeType;
  structure: 'percentage' | 'fixed' | 'tiered';
  value: number; // percentage or fixed amount
  currency: string;
  minimumFee?: number;
  maximumFee?: number;
  tierRules?: PaymentFeeTier[];
  applicableAmounts?: {
    minimum?: number;
    maximum?: number;
  };
}

export type PaymentFeeType = 
  | 'processing_fee' 
  | 'transaction_fee' 
  | 'gateway_fee' 
  | 'interchange_fee' 
  | 'assessment_fee' 
  | 'monthly_fee' 
  | 'setup_fee';

export interface PaymentFeeTier {
  minAmount: number;
  maxAmount?: number;
  feePercentage?: number;
  fixedFee?: number;
}

export interface PaymentLimits {
  minTransactionAmount?: number;
  maxTransactionAmount?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  maxRefundAmount?: number;
  maxRefundDays?: number;
}

export interface PaymentTransaction {
  id: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  paymentMethodType: PaymentMethodType;
  status: PaymentTransactionStatus;
  type: PaymentTransactionType;
  reference: string; // external payment reference
  authorizationCode?: string;
  processorTransactionId?: string;
  gatewayResponse?: PaymentGatewayResponse;
  fees: PaymentTransactionFee[];
  metadata: PaymentTransactionMetadata;
  createdAt: string;
  processedAt?: string;
  settledAt?: string;
  refundedAt?: string;
  failedAt?: string;
}

export type PaymentTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'authorized' 
  | 'captured' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded' 
  | 'partially_refunded' 
  | 'disputed' 
  | 'chargeback';

export type PaymentTransactionType = 
  | 'payment' 
  | 'refund' 
  | 'partial_refund' 
  | 'authorization' 
  | 'capture' 
  | 'void';

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId: string;
  authCode?: string;
  avsResult?: string;
  cvvResult?: string;
  riskScore?: number;
  processorMessage?: string;
  gatewayMessage?: string;
  fraudResult?: PaymentFraudResult;
}

export interface PaymentFraudResult {
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
  recommendation: 'approve' | 'review' | 'decline';
}

export interface PaymentTransactionFee {
  type: PaymentFeeType;
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentTransactionMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  terminalId?: string;
  employeeId?: string;
  locationId?: string;
  receiptNumber?: string;
  customFields?: Record<string, any>;
}

export interface PaymentRefund {
  id: string;
  originalTransactionId: string;
  amount: number;
  currency: string;
  reason: PaymentRefundReason;
  status: PaymentRefundStatus;
  refundMethod: 'original_payment_method' | 'cash' | 'store_credit' | 'check';
  processorRefundId?: string;
  metadata: {
    refundedBy: string;
    customerReason?: string;
    internalNotes?: string;
  };
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

export type PaymentRefundReason = 
  | 'customer_request' 
  | 'defective_product' 
  | 'cancelled_order' 
  | 'duplicate_charge' 
  | 'fraud_prevention' 
  | 'chargeback' 
  | 'system_error';

export type PaymentRefundStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface PaymentTerminal {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  status: PaymentTerminalStatus;
  location: {
    storeId: string;
    registerId?: string;
    description?: string;
  };
  capabilities: PaymentTerminalCapability[];
  connectivity: PaymentTerminalConnectivity;
  configuration: PaymentTerminalConfiguration;
  lastHeartbeat?: string;
  softwareVersion: string;
  hardwareVersion: string;
  batteryLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentTerminalStatus = 
  | 'online' 
  | 'offline' 
  | 'busy' 
  | 'error' 
  | 'maintenance' 
  | 'updating';

export type PaymentTerminalCapability = 
  | 'chip_card' 
  | 'magnetic_stripe' 
  | 'contactless' 
  | 'nfc' 
  | 'pin_entry' 
  | 'signature_capture' 
  | 'receipt_printing' 
  | 'barcode_scanning';

export interface PaymentTerminalConnectivity {
  type: 'ethernet' | 'wifi' | 'cellular' | 'bluetooth';
  ipAddress?: string;
  macAddress?: string;
  signalStrength?: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PaymentTerminalConfiguration {
  timeout: number; // seconds
  retryAttempts: number;
  autoUpdate: boolean;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface PaymentReport {
  id: string;
  type: PaymentReportType;
  period: {
    startDate: string;
    endDate: string;
  };
  filters: PaymentReportFilters;
  summary: PaymentReportSummary;
  details: PaymentReportDetail[];
  generatedAt: string;
  generatedBy: string;
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

export type PaymentReportType = 
  | 'daily_sales' 
  | 'payment_methods' 
  | 'transaction_details' 
  | 'refund_report' 
  | 'fee_analysis' 
  | 'settlement_report' 
  | 'fraud_report';

export interface PaymentReportFilters {
  paymentMethods?: string[];
  transactionTypes?: PaymentTransactionType[];
  statuses?: PaymentTransactionStatus[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  locations?: string[];
  employees?: string[];
}

export interface PaymentReportSummary {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  averageTransaction: number;
  successRate: number;
  refundRate: number;
  chargebackRate: number;
}

export interface PaymentReportDetail {
  transactionId: string;
  timestamp: string;
  amount: number;
  fees: number;
  paymentMethod: string;
  status: PaymentTransactionStatus;
  reference: string;
  customer?: string;
  employee?: string;
  location?: string;
}

export interface PaymentSecurity {
  id: string;
  encryptionMethod: 'aes_256' | 'rsa_2048' | 'elliptic_curve';
  tokenizationEnabled: boolean;
  fraudDetectionEnabled: boolean;
  riskThresholds: PaymentRiskThresholds;
  complianceChecks: PaymentComplianceCheck[];
  auditSettings: PaymentAuditSettings;
  updatedAt: string;
}

export interface PaymentRiskThresholds {
  lowRisk: {
    maxAmount: number;
    maxDailyVolume: number;
    maxVelocity: number;
  };
  mediumRisk: {
    maxAmount: number;
    maxDailyVolume: number;
    maxVelocity: number;
  };
  highRisk: {
    maxAmount: number;
    requireManualApproval: boolean;
    additionalVerification: string[];
  };
}

export interface PaymentComplianceCheck {
  type: 'pci_dss' | 'gdpr' | 'ccpa' | 'sox' | 'local_regulation';
  enabled: boolean;
  lastAuditDate?: string;
  nextAuditDate?: string;
  complianceLevel: 'compliant' | 'non_compliant' | 'pending_review';
  requirements: string[];
}

export interface PaymentAuditSettings {
  enableTransactionLogging: boolean;
  enableUserActionLogging: boolean;
  logRetentionDays: number;
  enableRealTimeMonitoring: boolean;
  alertThresholds: {
    suspiciousActivityLimit: number;
    failedTransactionLimit: number;
    highValueTransactionLimit: number;
  };
}

export type DocumentType = 'business_license' | 'tax_certificate' | 'insurance' | 'certification' | 'contract' | 'invoice' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
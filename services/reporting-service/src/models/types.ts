import { Decimal } from 'decimal.js';

// Enums
export enum ReportType {
  SALES = 'sales',
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
  CUSTOMER = 'customer',
  PAYMENT = 'payment',
  CUSTOM = 'custom',
  PRODUCT_PERFORMANCE = 'product_performance',
  TAX = 'tax'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum MetricType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio'
}

export enum AlertType {
  THRESHOLD = 'threshold',
  TREND = 'trend',
  ANOMALY = 'anomaly'
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  DISABLED = 'disabled'
}

export enum DashboardType {
  EXECUTIVE = 'executive',
  SALES = 'sales',
  OPERATIONS = 'operations',
  FINANCIAL = 'financial',
  CUSTOMER = 'customer',
  CUSTOM = 'custom'
}

// Core Interfaces
export interface Report {
  id: string;
  storeId: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  description?: string;
  dateFrom: Date;
  dateTo: Date;
  generatedAt: Date;
  generatedBy: string;
  data: ReportData;
  metadata: {
    generationTimeMs: number;
    totalRecords: number;
    dataPoints: number;
    granularity: TimeGranularity;
    filters: Record<string, any>;
  };
  schedule?: ReportSchedule;
  
  // Legacy fields for compatibility
  name?: string;
  status?: ReportStatus;
  config?: ReportConfig;
  filters?: ReportFilters;
  dataUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
  isScheduled?: boolean;
  scheduleConfig?: ScheduleConfig;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportConfig {
  dimensions: string[];
  metrics: string[];
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  includeSubtotals?: boolean;
  includeTotals?: boolean;
  customFields?: Array<{
    name: string;
    expression: string;
    type: 'string' | 'number' | 'date' | 'boolean';
  }>;
}

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  storeIds?: string[];
  customerIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
  paymentMethods?: string[];
  salesChannels?: string[];
  userIds?: string[];
  tags?: string[];
  customFilters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between';
    value: any;
  }>;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timezone: string;
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6, for weekly
  dayOfMonth?: number; // 1-31, for monthly
  recipients: string[];
  enabled: boolean;
  nextRunAt?: Date;
}

export interface Dashboard {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  type: DashboardType;
  layout: DashboardLayout;
  widgets: Widget[];
  config: DashboardConfig;
  
  // Access Control
  isPublic: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
  
  // Settings
  refreshInterval?: number; // seconds
  autoRefresh?: boolean;
  
  tags?: string[];
  metadata?: Record<string, any>;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: {
    width: number;
    height: number;
  };
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  
  // Position & Size
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Data Configuration
  dataSource: WidgetDataSource;
  config: WidgetConfig;
  
  // Display Settings
  style: WidgetStyle;
  
  // Refresh Settings
  refreshInterval?: number;
  lastRefreshed?: Date;
  
  metadata: Record<string, any>;
}

export enum WidgetType {
  METRIC = 'metric',
  CHART = 'chart',
  TABLE = 'table',
  GAUGE = 'gauge',
  MAP = 'map',
  TEXT = 'text',
  IMAGE = 'image',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  LIST = 'list',
  MULTI_METRIC = 'multi_metric'
}

export interface WidgetDataSource {
  type: 'query' | 'report' | 'api' | 'static';
  query?: string;
  reportId?: string;
  apiEndpoint?: string;
  staticData?: any;
  filters?: ReportFilters;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'heatmap';
  xAxis?: string;
  yAxis?: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  showLegend?: boolean;
  showDataLabels?: boolean;
  colors?: string[];
  customOptions?: Record<string, any>;
}

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  customCSS?: string;
}

export interface Metric {
  id: string;
  storeId: string;
  name: string;
  displayName: string;
  description?: string;
  
  // Configuration
  type: MetricType;
  category: string;
  unit?: string;
  calculation: MetricCalculation;
  
  // Current Value
  currentValue?: Decimal;
  previousValue?: Decimal;
  percentageChange?: Decimal;
  
  // Target & Thresholds
  target?: Decimal;
  thresholds: MetricThreshold[];
  
  // Historical Data
  historicalData?: MetricDataPoint[];
  
  // Metadata
  isActive: boolean;
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricCalculation {
  query: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom';
  filters?: ReportFilters;
  timeWindow?: {
    value: number;
    unit: 'hour' | 'day' | 'week' | 'month';
  };
  customFormula?: string;
}

export interface MetricThreshold {
  level: 'info' | 'warning' | 'critical';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  value: Decimal;
  color?: string;
  message?: string;
}

export interface MetricDataPoint {
  timestamp: Date;
  value: Decimal;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  type: AlertType;
  status: AlertStatus;
  
  // Configuration
  condition: AlertCondition;
  actions: AlertAction[];
  
  // Timing
  checkInterval: number; // seconds
  lastChecked?: Date;
  lastTriggered?: Date;
  nextCheck?: Date;
  
  // Metadata
  isActive: boolean;
  tags: string[];
  metadata: Record<string, any>;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  metricId?: string;
  query?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'change_gt' | 'change_lt';
  value: Decimal;
  timeWindow?: {
    value: number;
    unit: 'minute' | 'hour' | 'day';
  };
  consecutiveOccurrences?: number;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'notification';
  recipients?: string[];
  webhookUrl?: string;
  message?: string;
  template?: string;
  enabled: boolean;
}

export interface AlertInstance {
  id: string;
  alertId: string;
  storeId: string;
  
  triggeredAt: Date;
  resolvedAt?: Date;
  
  triggerValue: Decimal;
  threshold: Decimal;
  
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  actionsExecuted: Array<{
    type: string;
    status: 'success' | 'failed';
    executedAt: Date;
    error?: string;
  }>;
  
  metadata: Record<string, any>;
}

// Analytics Interfaces
export interface SalesAnalytics {
  period: {
    from: Date;
    to: Date;
    granularity: TimeGranularity;
  };
  
  overview: {
    totalRevenue: Decimal;
    totalOrders: number;
    averageOrderValue: Decimal;
    grossMargin: Decimal;
    netMargin: Decimal;
    
    // Growth Metrics
    revenueGrowth: Decimal;
    orderGrowth: Decimal;
    customerGrowth: Decimal;
  };
  
  trends: Array<{
    date: Date;
    revenue: Decimal;
    orders: number;
    customers: number;
    averageOrderValue: Decimal;
  }>;
  
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: Decimal;
    quantity: number;
    orders: number;
  }>;
  
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    revenue: Decimal;
    quantity: number;
    orders: number;
  }>;
  
  salesChannels: Array<{
    channel: string;
    revenue: Decimal;
    orders: number;
    percentage: Decimal;
  }>;
  
  paymentMethods: Array<{
    method: string;
    revenue: Decimal;
    orders: number;
    percentage: Decimal;
  }>;
  
  hourlyDistribution: Array<{
    hour: number;
    revenue: Decimal;
    orders: number;
  }>;
  
  weeklyDistribution: Array<{
    dayOfWeek: number;
    revenue: Decimal;
    orders: number;
  }>;
}

export interface CustomerAnalytics {
  period: {
    from: Date;
    to: Date;
  };
  
  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerRetentionRate: Decimal;
    customerLifetimeValue: Decimal;
    averageOrdersPerCustomer: Decimal;
  };
  
  segments: Array<{
    segment: string;
    customers: number;
    revenue: Decimal;
    averageOrderValue: Decimal;
    percentage: Decimal;
  }>;
  
  cohortAnalysis: Array<{
    cohort: string;
    totalCustomers: number;
    periods: Array<{
      period: number;
      customers: number;
      retentionRate: Decimal;
    }>;
  }>;
  
  geographic: Array<{
    country: string;
    state?: string;
    city?: string;
    customers: number;
    revenue: Decimal;
  }>;
  
  acquisitionChannels: Array<{
    channel: string;
    customers: number;
    revenue: Decimal;
    costPerAcquisition?: Decimal;
  }>;
}

export interface InventoryAnalytics {
  overview: {
    totalProducts: number;
    totalValue: Decimal;
    lowStockItems: number;
    outOfStockItems: number;
    averageInventoryTurnover: Decimal;
  };
  
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minimumStock: number;
    suggestedReorder: number;
  }>;
  
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: Decimal;
    inventoryTurnover: Decimal;
  }>;
  
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    daysSinceLastSale: number;
    suggestedAction: string;
  }>;
  
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    totalValue: Decimal;
    inventoryTurnover: Decimal;
    profitMargin: Decimal;
  }>;
}

export interface FinancialAnalytics {
  period: {
    from: Date;
    to: Date;
  };
  
  revenue: {
    gross: Decimal;
    net: Decimal;
    recurring: Decimal;
    oneTime: Decimal;
  };
  
  expenses: {
    total: Decimal;
    categories: Array<{
      category: string;
      amount: Decimal;
      percentage: Decimal;
    }>;
  };
  
  profitability: {
    grossProfit: Decimal;
    grossMargin: Decimal;
    netProfit: Decimal;
    netMargin: Decimal;
    ebitda?: Decimal;
  };
  
  cashFlow: {
    operating: Decimal;
    investing: Decimal;
    financing: Decimal;
    net: Decimal;
  };
  
  kpis: Array<{
    name: string;
    value: Decimal;
    target?: Decimal;
    trend: 'up' | 'down' | 'stable';
  }>;
}

// DTOs and Query Interfaces
export interface CreateReportDto {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  config: ReportConfig;
  filters: ReportFilters;
  scheduleConfig?: ScheduleConfig;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateReportDto {
  name?: string;
  description?: string;
  config?: ReportConfig;
  filters?: ReportFilters;
  scheduleConfig?: ScheduleConfig;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateDashboardDto {
  name: string;
  description?: string;
  type: DashboardType;
  layout: DashboardLayout;
  widgets: Omit<DashboardWidget, 'id'>[];
  isPublic?: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDashboardDto {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  widgets?: DashboardWidget[];
  isPublic?: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateMetricDto {
  name: string;
  displayName: string;
  description?: string;
  type: MetricType;
  category: string;
  unit?: string;
  calculation: MetricCalculation;
  target?: Decimal;
  thresholds?: MetricThreshold[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateAlertDto {
  name: string;
  description?: string;
  type: AlertType;
  condition: AlertCondition;
  actions: AlertAction[];
  checkInterval: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ReportQuery {
  page?: number;
  pageSize?: number;
  type?: ReportType;
  status?: ReportStatus;
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardQuery {
  page?: number;
  pageSize?: number;
  type?: DashboardType;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MetricQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  type?: MetricType;
  search?: string;
  tags?: string[];
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AlertQuery {
  page?: number;
  pageSize?: number;
  type?: AlertType;
  status?: AlertStatus;
  search?: string;
  tags?: string[];
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsQuery {
  dateFrom: Date;
  dateTo: Date;
  granularity?: TimeGranularity;
  storeIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
  includeComparisons?: boolean;
  previousPeriod?: boolean;
}

// Export and Import Types
export interface ExportRequest {
  reportId?: string;
  query?: any;
  format: ReportFormat;
  filename?: string;
  includeMetadata?: boolean;
}

export interface ImportRequest {
  data: any;
  format: 'json' | 'csv';
  mapping?: Record<string, string>;
  validateOnly?: boolean;
}

// Real-time Data Types
export interface RealtimeMetric {
  metricId: string;
  value: Decimal;
  timestamp: Date;
  change?: Decimal;
  trend?: 'up' | 'down' | 'stable';
}

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: Date;
  storeId: string;
}

// Cache Types
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  key: string;
  tags?: string[];
}

export interface CachedResult<T = any> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  key: string;
  tags: string[];
}

// Additional Report Types
export interface ReportRequest {
  storeId: string;
  userId: string;
  type: ReportType;
  format: ReportFormat;
  dateFrom: Date;
  dateTo: Date;
  granularity?: TimeGranularity;
  filters?: Record<string, any>;
  schedule?: ReportSchedule;
  cache?: boolean;
}

export interface ReportData {
  summary?: Record<string, any>;
  trends?: any[];
  products?: any[];
  segments?: any[];
  geographic?: any[];
  channels?: any[];
  timeDistribution?: any;
  lowStock?: any[];
  topSelling?: any[];
  slowMoving?: any[];
  categories?: any[];
  revenue?: any;
  expenses?: any;
  profitability?: any;
  kpis?: any[];
  taxSummary?: any[];
  totalTaxCollected?: Decimal;
  totalNetAmount?: Decimal;
}

export interface ReportSchedule {
  id?: string;
  storeId: string;
  reportType: ReportType;
  reportFormat: ReportFormat;
  schedulePattern: string; // cron expression
  timezone: string;
  dateFromOffset: number; // days
  dateToOffset: number; // days
  recipients: string[];
  isActive?: boolean;
}

// Widget and Dashboard Types for Dashboard Service
export interface Widget {
  id?: string;
  dashboardId: string;
  title: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  refreshInterval: number;
  isVisible: boolean;
  data?: WidgetData;
  lastRefreshed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetData {
  value?: Decimal;
  trend?: 'up' | 'down' | 'stable';
  change?: Decimal;
  series?: Array<{ date: Date; value: Decimal }>;
  categories?: Array<{ name: string; value: Decimal; percentage: Decimal }>;
  rows?: Array<Record<string, any>>;
  lastUpdated: Date;
  error?: string;
}

export interface DashboardConfig {
  name: string;
  description?: string;
  layout?: Array<{ x: number; y: number; w: number; h: number; i: string }>;
  isPublic?: boolean;
  refreshInterval?: number;
  theme?: string;
}

// Alert Configuration Types for Alert Service
export interface AlertConfig {
  name: string;
  description?: string;
  type: AlertType;
  metric: string;
  operator?: 'greater_than' | 'less_than' | 'equals';
  threshold?: Decimal;
  timeWindow?: string;
  direction?: 'increasing' | 'decreasing';
  period?: number;
  granularity?: TimeGranularity;
  rules?: AlertRule[];
  notificationChannels?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  action: string;
}

export interface ThresholdConfig {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals';
  threshold: Decimal;
  timeWindow: string;
}

export interface TrendConfig {
  metric: string;
  direction: 'increasing' | 'decreasing';
  threshold: Decimal;
  period: number;
  granularity: TimeGranularity;
}

// Enhanced Alert Interface for Alert Service
export interface EnhancedAlert extends Alert {
  config: AlertConfig;
  rules: AlertRule[];
  notificationChannels: string[];
  isEnabled: boolean;
  lastTriggeredAt?: Date;
}

// Enhanced AlertInstance for Alert Service
export interface EnhancedAlertInstance extends AlertInstance {
  status: 'triggered' | 'resolved';
  data: Record<string, any>;
  metadata: Record<string, any>;
}
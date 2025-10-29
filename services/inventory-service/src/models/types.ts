export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brand?: string;
  unitPrice: number;
  costPrice: number;
  taxable: boolean;
  taxRate?: number;
  trackStock: boolean;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  unit: string; // piece, kg, liter, etc.
  status: 'active' | 'inactive' | 'discontinued';
  imageUrl?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ProductCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string; // hierarchical path like "Electronics/Phones/Smartphones"
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  productId: string;
  storeId: string;
  locationId?: string; // warehouse/storage location
  quantity: number;
  reservedQuantity: number; // quantity reserved for pending orders
  availableQuantity: number; // quantity - reservedQuantity
  unitCost: number;
  totalValue: number;
  lastRestockDate?: Date;
  lastSaleDate?: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  storeId: string;
  locationId?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damaged' | 'expired';
  reason: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: 'purchase_order' | 'sale' | 'return' | 'adjustment' | 'transfer';
  referenceId?: string;
  notes?: string;
  performedBy: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  status: 'active' | 'inactive' | 'blocked';
  rating?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  storeId: string;
  supplierId: string;
  orderNumber: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  taxAmount: number;
  shippingCost?: number;
  discount?: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface InventoryAlert {
  id: string;
  storeId: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expired' | 'reorder_point';
  productId: string;
  productName: string;
  currentQuantity: number;
  threshold?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

// DTOs for API requests/responses
export interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brand?: string;
  unitPrice: number;
  costPrice: number;
  taxable: boolean;
  taxRate?: number;
  trackStock: boolean;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  unit: string;
  imageUrl?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface ProductSearchQuery {
  q?: string; // search term
  categoryId?: string;
  brand?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  trackStock?: boolean;
  lowStock?: boolean;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockAdjustmentDto {
  productId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  reason: string;
  unitCost?: number;
  notes?: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
}
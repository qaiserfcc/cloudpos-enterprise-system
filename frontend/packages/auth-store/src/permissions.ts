import type { User } from '@cloudpos/types';
import { USER_ROLES } from '@cloudpos/utils';

// Check if user has specific role
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

// Check if user is admin
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, USER_ROLES.ADMIN);
};

// Check if user is cashier
export const isCashier = (user: User | null): boolean => {
  return hasRole(user, USER_ROLES.CASHIER);
};

// Check if user is customer
export const isCustomer = (user: User | null): boolean => {
  return hasRole(user, USER_ROLES.CUSTOMER);
};

// Check if user has specific permission
export const hasPermission = (user: User | null, permission: string): boolean => {
  return user?.permissions?.includes(permission) || false;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user?.permissions) return false;
  return permissions.some(permission => user.permissions.includes(permission));
};

// Check if user has all specified permissions
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user?.permissions) return false;
  return permissions.every(permission => user.permissions.includes(permission));
};

// Check if user can access admin features
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdmin(user) || hasPermission(user, 'admin_access');
};

// Check if user can manage users
export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user) || hasPermission(user, 'manage_users');
};

// Check if user can manage products
export const canManageProducts = (user: User | null): boolean => {
  return isAdmin(user) || hasAnyPermission(user, ['manage_products', 'edit_products']);
};

// Check if user can view reports
export const canViewReports = (user: User | null): boolean => {
  return isAdmin(user) || hasAnyPermission(user, ['view_reports', 'admin_access']);
};

// Check if user can process sales
export const canProcessSales = (user: User | null): boolean => {
  return isCashier(user) || isAdmin(user) || hasPermission(user, 'process_sales');
};

// Check if user can manage inventory
export const canManageInventory = (user: User | null): boolean => {
  return isAdmin(user) || hasAnyPermission(user, ['manage_inventory', 'edit_inventory']);
};

// Route access permissions mapping
export const ROUTE_PERMISSIONS = {
  '/admin': canAccessAdmin,
  '/admin/users': canManageUsers,
  '/admin/products': canManageProducts,
  '/admin/reports': canViewReports,
  '/admin/inventory': canManageInventory,
  '/pos': canProcessSales,
  '/pos/sales': canProcessSales,
  '/customer': isCustomer,
} as const;

// Check if user can access a specific route
export const canAccessRoute = (user: User | null, route: string): boolean => {
  const permission = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS];
  return permission ? permission(user) : false;
};
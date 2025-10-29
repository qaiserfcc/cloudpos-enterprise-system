import React, { ReactNode } from 'react';
import { useAppSelector } from './hooks';
import { selectAuth } from './authSlice';
import { canAccessRoute } from './permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  route?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPermission,
  route,
  fallback 
}) => {
  const { user, isAuthenticated } = useAppSelector(selectAuth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return fallback || <div>Please log in to access this page.</div>;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return fallback || <div>Access denied. Insufficient permissions.</div>;
  }

  // Check permission-based access
  if (requiredPermission && !user?.permissions?.includes(requiredPermission)) {
    return fallback || <div>Access denied. Insufficient permissions.</div>;
  }

  // Check route-based access
  if (route && !canAccessRoute(user, route)) {
    return fallback || <div>Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
};
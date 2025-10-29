// Redux store
export { default as authReducer } from './authSlice';
export {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  clearError,
  updateUser,
  setLoading,
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectUserRole,
  selectPermissions,
  selectAuthLoading,
  selectAuthError,
  selectToken,
} from './authSlice';

export {
  login,
  logout as logoutThunk,
  checkAuth,
  refreshToken,
} from './authThunks';

// React components
export { AuthProvider } from './AuthProvider';
export { ProtectedRoute } from './ProtectedRoute';

// Hooks and utilities
export { useAppDispatch, useAppSelector } from './hooks';
export * from './permissions';

// Types
export * from './types';
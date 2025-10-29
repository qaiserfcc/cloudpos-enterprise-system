import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '@cloudpos/api-client';
import type { User } from '@cloudpos/types';
import { STORAGE_KEYS } from '@cloudpos/utils';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, setLoading } from './authSlice';

export interface LoginCredentials {
  email: string;
  password: string;
}

// Login thunk
export const login = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      
      const response = await dispatch(authApi.endpoints.login.initiate(credentials)).unwrap();
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store token in localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        
        dispatch(loginSuccess({ user, token }));
        return { user, token };
      } else {
        const error = response.message || 'Login failed';
        dispatch(loginFailure(error));
        return rejectWithValue(error);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Network error during login';
      dispatch(loginFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch, getState }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      
      if (state.auth.token) {
        // Call logout API to invalidate token on server
        await dispatch(authApi.endpoints.logout.initiate()).unwrap();
      }
    } catch (error) {
      // Even if logout API fails, we should still clear local state
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state and token
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      dispatch(logoutAction());
    }
  }
);

// Check authentication status thunk
export const checkAuth = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/checkAuth',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      
      if (!state.auth.token) {
        return rejectWithValue('No token found');
      }
      
      dispatch(setLoading(true));
      
      const response = await dispatch(authApi.endpoints.getCurrentUser.initiate()).unwrap();
      
      if (response.success && response.data) {
        // Update user data but keep existing token
        dispatch(loginSuccess({ 
          user: response.data, 
          token: state.auth.token 
        }));
        return response.data;
      } else {
        dispatch(logoutAction());
        return rejectWithValue('Invalid token');
      }
    } catch (error: any) {
      dispatch(logoutAction());
      return rejectWithValue(error?.data?.message || 'Authentication check failed');
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Refresh token thunk (placeholder for future implementation)
export const refreshToken = createAsyncThunk<
  { user: User; token: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // TODO: Implement refresh token API call when available
      console.log('Refresh token not yet implemented');
      dispatch(logoutAction());
      return rejectWithValue('Refresh token not implemented');
    } catch (error: any) {
      dispatch(logoutAction());
      return rejectWithValue(error?.data?.message || 'Token refresh failed');
    }
  }
);
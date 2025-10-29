import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  ApiResponse, 
  User, 
  Product
} from '@cloudpos/types';

// Base API configuration with RTK Query
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      // Type the getState function
      const state = getState() as { auth?: { token?: string } };
      const token = state?.auth?.token;
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Product', 'Category', 'Customer', 'Sale', 'Inventory', 'Report'],
  endpoints: () => ({}),
});

// Auth API endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      ApiResponse<{ user: User; token: string }>,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
});

// Users API endpoints  
export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<User[]>, void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Products API endpoints
export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiResponse<Product[]>, void>({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    getProductById: builder.query<ApiResponse<Product>, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    searchProducts: builder.query<ApiResponse<Product[]>, string>({
      query: (searchQuery) => `/products/search?q=${encodeURIComponent(searchQuery)}`,
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
} = usersApi;

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useSearchProductsQuery,
} = productsApi;

// Export the main API instance
export default api;
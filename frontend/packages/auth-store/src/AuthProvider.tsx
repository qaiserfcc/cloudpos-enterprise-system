import React, { useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { checkAuth } from './authThunks';
import { selectAuth } from './authSlice';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(selectAuth);

  useEffect(() => {
    // Check authentication on app start
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};
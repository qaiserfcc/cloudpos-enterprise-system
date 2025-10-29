import { configureStore } from '@reduxjs/toolkit';
import authSliceReducer from './authSlice';

// Create a dummy store for type extraction
const store = configureStore({
  reducer: {
    auth: authSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
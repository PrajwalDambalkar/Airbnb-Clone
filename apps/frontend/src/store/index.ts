// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertiesReducer from './slices/propertiesSlice';
import bookingsReducer from './slices/bookingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    bookings: bookingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date objects
        ignoredActions: ['bookings/setCheckInDate', 'bookings/setCheckOutDate'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.checkInDate', 'payload.checkOutDate'],
        // Ignore these paths in the state
        ignoredPaths: ['bookings.checkInDate', 'bookings.checkOutDate'],
      },
    }),
  devTools: import.meta.env.DEV, // Explicitly enable Redux DevTools in development
});

// Log initial state for debugging
console.log('🔴 Redux Store Initialized');
console.log('📦 Initial State:', store.getState());

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


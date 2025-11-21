// src/store/__tests__/testUtils.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import propertiesReducer from '../slices/propertiesSlice';
import bookingsReducer from '../slices/bookingsSlice';
import type { RootState } from '../index';

const rootReducer = combineReducers({
  auth: authReducer,
  properties: propertiesReducer,
  bookings: bookingsReducer,
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as any,
  });
}

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];


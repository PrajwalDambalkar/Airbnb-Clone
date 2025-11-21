// src/store/slices/bookingsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import bookingService, { type Booking, type CreateBookingData } from '../../services/bookingService';

interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  favorites: string[]; // Array of property IDs
  loading: boolean;
  error: string | null;
  bookingStatus: 'idle' | 'pending' | 'success' | 'failed';
}

const initialState: BookingsState = {
  bookings: [],
  selectedBooking: null,
  favorites: [],
  loading: false,
  error: null,
  bookingStatus: 'idle',
};

// Async Thunks

// Fetch all bookings for logged-in user
export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookings(status);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Fetch single booking by ID
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

// Create new booking
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData: CreateBookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

// Update booking status
export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBookingStatus(id, status);
      return { id, status, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking');
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelBooking(id, reason);
      return { id, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

// Load favorites from localStorage
export const loadFavorites = createAsyncThunk(
  'bookings/loadFavorites',
  async (userId: string, { rejectWithValue }) => {
    try {
      const favs = localStorage.getItem(`favorites_${userId}`);
      return favs ? JSON.parse(favs) : [];
    } catch (error) {
      return rejectWithValue('Failed to load favorites');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // Add to favorites
    addFavorite: (state, action: PayloadAction<{ propertyId: string; userId: string }>) => {
      const { propertyId, userId } = action.payload;
      if (!state.favorites.includes(propertyId)) {
        state.favorites.push(propertyId);
        // Persist to localStorage
        localStorage.setItem(`favorites_${userId}`, JSON.stringify(state.favorites));
        // Dispatch custom event for other components
        window.dispatchEvent(new Event('favoritesUpdated'));
      }
    },
    // Remove from favorites
    removeFavorite: (state, action: PayloadAction<{ propertyId: string; userId: string }>) => {
      const { propertyId, userId } = action.payload;
      state.favorites = state.favorites.filter((id) => id !== propertyId);
      // Persist to localStorage
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(state.favorites));
      // Dispatch custom event for other components
      window.dispatchEvent(new Event('favoritesUpdated'));
    },
    // Toggle favorite
    toggleFavorite: (state, action: PayloadAction<{ propertyId: string; userId: string }>) => {
      const { propertyId, userId } = action.payload;
      if (state.favorites.includes(propertyId)) {
        state.favorites = state.favorites.filter((id) => id !== propertyId);
      } else {
        state.favorites.push(propertyId);
      }
      // Persist to localStorage
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(state.favorites));
      // Dispatch custom event for other components
      window.dispatchEvent(new Event('favoritesUpdated'));
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Reset booking status
    resetBookingStatus: (state) => {
      state.bookingStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch bookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch booking by ID
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
        state.error = null;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.bookingStatus = 'pending';
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingStatus = 'success';
        state.bookings.push(action.payload);
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.bookingStatus = 'failed';
        state.error = action.payload as string;
      });

    // Update booking status
    builder
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { id, status } = action.payload;
        const bookingIndex = state.bookings.findIndex((b) => b.id === id);
        if (bookingIndex !== -1) {
          state.bookings[bookingIndex].status = status;
        }
        state.error = null;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const { id } = action.payload;
        const bookingIndex = state.bookings.findIndex((b) => b.id === id);
        if (bookingIndex !== -1) {
          state.bookings[bookingIndex].status = 'CANCELLED';
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load favorites
    builder
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });
  },
});

export const {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearError,
  resetBookingStatus,
} = bookingsSlice.actions;

// Selectors
export const selectBookings = (state: { bookings: BookingsState }) => state.bookings.bookings;
export const selectSelectedBooking = (state: { bookings: BookingsState }) => state.bookings.selectedBooking;
export const selectFavorites = (state: { bookings: BookingsState }) => state.bookings.favorites;
export const selectBookingsLoading = (state: { bookings: BookingsState }) => state.bookings.loading;
export const selectBookingsError = (state: { bookings: BookingsState }) => state.bookings.error;
export const selectBookingStatus = (state: { bookings: BookingsState }) => state.bookings.bookingStatus;

export default bookingsSlice.reducer;


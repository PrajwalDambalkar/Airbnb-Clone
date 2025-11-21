// src/store/slices/propertiesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { propertyService } from '../../services/propertyService';
import type { Property } from '../../types/property';

interface PropertiesState {
  properties: Property[];
  allProperties: Property[]; // Unfiltered list for search
  selectedProperty: Property | null;
  loading: boolean;
  error: string | null;
  filters: {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    guests: string;
  };
}

const initialState: PropertiesState = {
  properties: [],
  allProperties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  filters: {
    destination: '',
    checkInDate: '',
    checkOutDate: '',
    guests: '',
  },
};

// Async Thunks

// Fetch all properties
export const fetchProperties = createAsyncThunk(
  'properties/fetchAll',
  async (filters: { city?: string; min_price?: number; max_price?: number; guests?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await propertyService.getAllProperties(filters);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch properties');
    }
  }
);

// Fetch single property by ID
export const fetchPropertyById = createAsyncThunk(
  'properties/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertyById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch property');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    // Set filters
    setDestination: (state, action: PayloadAction<string>) => {
      state.filters.destination = action.payload;
    },
    setCheckInDate: (state, action: PayloadAction<string>) => {
      state.filters.checkInDate = action.payload;
    },
    setCheckOutDate: (state, action: PayloadAction<string>) => {
      state.filters.checkOutDate = action.payload;
    },
    setGuests: (state, action: PayloadAction<string>) => {
      state.filters.guests = action.payload;
    },
    // Apply filters to properties
    applyFilters: (state) => {
      let filtered = [...state.allProperties];

      // Filter by destination
      if (state.filters.destination) {
        filtered = filtered.filter((p) => {
          const cityMatch = p.city.toLowerCase().includes(state.filters.destination.toLowerCase());
          const cityStateMatch = `${p.city}, ${p.state}`.toLowerCase().includes(state.filters.destination.toLowerCase());
          return cityMatch || cityStateMatch;
        });
      }

      // Filter by guests
      if (state.filters.guests) {
        const guestCount = parseInt(state.filters.guests);
        filtered = filtered.filter((p) => p.max_guests >= guestCount);
      }

      state.properties = filtered;
    },
    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        destination: '',
        checkInDate: '',
        checkOutDate: '',
        guests: '',
      };
      state.properties = state.allProperties;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all properties
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
        state.allProperties = action.payload;
        state.error = null;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch property by ID
    builder
      .addCase(fetchPropertyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProperty = action.payload;
        state.error = null;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDestination,
  setCheckInDate,
  setCheckOutDate,
  setGuests,
  applyFilters,
  clearFilters,
  clearError,
} = propertiesSlice.actions;

// Selectors
export const selectProperties = (state: { properties: PropertiesState }) => state.properties.properties;
export const selectAllProperties = (state: { properties: PropertiesState }) => state.properties.allProperties;
export const selectSelectedProperty = (state: { properties: PropertiesState }) => state.properties.selectedProperty;
export const selectPropertiesLoading = (state: { properties: PropertiesState }) => state.properties.loading;
export const selectPropertiesError = (state: { properties: PropertiesState }) => state.properties.error;
export const selectPropertiesFilters = (state: { properties: PropertiesState }) => state.properties.filters;

export default propertiesSlice.reducer;


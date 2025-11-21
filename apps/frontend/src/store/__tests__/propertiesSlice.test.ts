// src/store/__tests__/propertiesSlice.test.ts
import { setupStore, type AppStore } from './testUtils';
import propertiesReducer, {
  fetchProperties,
  fetchPropertyById,
  setDestination,
  setCheckInDate,
  setCheckOutDate,
  setGuests,
  applyFilters,
  clearFilters,
  clearError,
  selectProperties,
  selectAllProperties,
  selectSelectedProperty,
  selectPropertiesLoading,
  selectPropertiesError,
  selectPropertiesFilters,
} from '../slices/propertiesSlice';
import { propertyService } from '../../services/propertyService';

// Mock the propertyService
jest.mock('../../services/propertyService', () => ({
  propertyService: {
    getAllProperties: jest.fn(),
    getPropertyById: jest.fn(),
  },
}));

describe('propertiesSlice', () => {
  let store: AppStore;

  const mockProperties = [
    {
      id: '1',
      owner_id: 'owner1',
      property_name: 'Beach House',
      property_type: 'house',
      description: 'Beautiful beach house',
      address: '123 Beach St',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipcode: '90001',
      bedrooms: 3,
      bathrooms: '2',
      max_guests: 6,
      price_per_night: '200',
      cleaning_fee: '50',
      service_fee: '25',
      amenities: ['wifi', 'pool'],
      images: ['image1.jpg'],
      available: 1,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: '2',
      owner_id: 'owner2',
      property_name: 'Mountain Cabin',
      property_type: 'cabin',
      description: 'Cozy mountain cabin',
      address: '456 Mountain Rd',
      city: 'Denver',
      state: 'CO',
      country: 'USA',
      zipcode: '80201',
      bedrooms: 2,
      bathrooms: '1',
      max_guests: 4,
      price_per_night: '150',
      cleaning_fee: '40',
      service_fee: '20',
      amenities: ['wifi', 'fireplace'],
      images: ['image2.jpg'],
      available: 1,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ];

  beforeEach(() => {
    store = setupStore();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().properties;
      expect(state).toEqual({
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
      });
    });
  });

  describe('reducers', () => {
    it('should handle setDestination', () => {
      store.dispatch(setDestination('Los Angeles'));
      const state = store.getState().properties;
      expect(state.filters.destination).toBe('Los Angeles');
    });

    it('should handle setCheckInDate', () => {
      store.dispatch(setCheckInDate('2025-01-01'));
      const state = store.getState().properties;
      expect(state.filters.checkInDate).toBe('2025-01-01');
    });

    it('should handle setCheckOutDate', () => {
      store.dispatch(setCheckOutDate('2025-01-05'));
      const state = store.getState().properties;
      expect(state.filters.checkOutDate).toBe('2025-01-05');
    });

    it('should handle setGuests', () => {
      store.dispatch(setGuests('4'));
      const state = store.getState().properties;
      expect(state.filters.guests).toBe('4');
    });

    it('should handle clearError', () => {
      store = setupStore({
        properties: {
          properties: [],
          allProperties: [],
          selectedProperty: null,
          loading: false,
          error: 'Test error',
          filters: {
            destination: '',
            checkInDate: '',
            checkOutDate: '',
            guests: '',
          },
        },
      } as any);

      store.dispatch(clearError());
      const state = store.getState().properties;
      expect(state.error).toBeNull();
    });

    it('should handle clearFilters', () => {
      store = setupStore({
        properties: {
          properties: [mockProperties[0]],
          allProperties: mockProperties,
          selectedProperty: null,
          loading: false,
          error: null,
          filters: {
            destination: 'Los Angeles',
            checkInDate: '2025-01-01',
            checkOutDate: '2025-01-05',
            guests: '4',
          },
        },
      } as any);

      store.dispatch(clearFilters());
      const state = store.getState().properties;
      expect(state.filters).toEqual({
        destination: '',
        checkInDate: '',
        checkOutDate: '',
        guests: '',
      });
      expect(state.properties).toEqual(mockProperties);
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      store = setupStore({
        properties: {
          properties: mockProperties,
          allProperties: mockProperties,
          selectedProperty: null,
          loading: false,
          error: null,
          filters: {
            destination: '',
            checkInDate: '',
            checkOutDate: '',
            guests: '',
          },
        },
      } as any);
    });

    it('should filter by destination (city)', () => {
      store.dispatch(setDestination('Los Angeles'));
      store.dispatch(applyFilters());
      const state = store.getState().properties;
      expect(state.properties).toHaveLength(1);
      expect(state.properties[0].city).toBe('Los Angeles');
    });

    it('should filter by destination (city, state)', () => {
      store.dispatch(setDestination('Denver, CO'));
      store.dispatch(applyFilters());
      const state = store.getState().properties;
      expect(state.properties).toHaveLength(1);
      expect(state.properties[0].city).toBe('Denver');
    });

    it('should filter by guests', () => {
      store.dispatch(setGuests('5'));
      store.dispatch(applyFilters());
      const state = store.getState().properties;
      expect(state.properties).toHaveLength(1);
      expect(state.properties[0].max_guests).toBeGreaterThanOrEqual(5);
    });

    it('should filter by both destination and guests', () => {
      store.dispatch(setDestination('Los Angeles'));
      store.dispatch(setGuests('6'));
      store.dispatch(applyFilters());
      const state = store.getState().properties;
      expect(state.properties).toHaveLength(1);
      expect(state.properties[0].city).toBe('Los Angeles');
      expect(state.properties[0].max_guests).toBeGreaterThanOrEqual(6);
    });

    it('should return empty array when no properties match', () => {
      store.dispatch(setDestination('New York'));
      store.dispatch(applyFilters());
      const state = store.getState().properties;
      expect(state.properties).toHaveLength(0);
    });
  });

  describe('fetchProperties async thunk', () => {
    it('should handle successful fetch', async () => {
      (propertyService.getAllProperties as jest.Mock).mockResolvedValue({
        data: mockProperties,
      });

      await store.dispatch(fetchProperties(undefined));

      const state = store.getState().properties;
      expect(state.properties).toEqual(mockProperties);
      expect(state.allProperties).toEqual(mockProperties);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch with filters', async () => {
      (propertyService.getAllProperties as jest.Mock).mockResolvedValue({
        data: [mockProperties[0]],
      });

      await store.dispatch(
        fetchProperties({ city: 'Los Angeles', guests: 4 })
      );

      const state = store.getState().properties;
      expect(propertyService.getAllProperties).toHaveBeenCalledWith({
        city: 'Los Angeles',
        guests: 4,
      });
    });

    it('should handle fetch failure', async () => {
      const errorMessage = 'Failed to fetch properties';
      (propertyService.getAllProperties as jest.Mock).mockRejectedValue({
        message: errorMessage,
      });

      await store.dispatch(fetchProperties(undefined));

      const state = store.getState().properties;
      expect(state.properties).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should set loading to true while fetching', () => {
      (propertyService.getAllProperties as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchProperties(undefined));

      const state = store.getState().properties;
      expect(state.loading).toBe(true);
    });
  });

  describe('fetchPropertyById async thunk', () => {
    it('should handle successful fetch', async () => {
      (propertyService.getPropertyById as jest.Mock).mockResolvedValue({
        data: mockProperties[0],
      });

      await store.dispatch(fetchPropertyById('1'));

      const state = store.getState().properties;
      expect(state.selectedProperty).toEqual(mockProperties[0]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch failure', async () => {
      const errorMessage = 'Property not found';
      (propertyService.getPropertyById as jest.Mock).mockRejectedValue({
        message: errorMessage,
      });

      await store.dispatch(fetchPropertyById('999'));

      const state = store.getState().properties;
      expect(state.selectedProperty).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    const mockState = {
      properties: {
        properties: [mockProperties[0]],
        allProperties: mockProperties,
        selectedProperty: mockProperties[0],
        loading: false,
        error: 'Test error',
        filters: {
          destination: 'Los Angeles',
          checkInDate: '2025-01-01',
          checkOutDate: '2025-01-05',
          guests: '4',
        },
      },
    };

    it('should select properties', () => {
      expect(selectProperties(mockState)).toEqual([mockProperties[0]]);
    });

    it('should select allProperties', () => {
      expect(selectAllProperties(mockState)).toEqual(mockProperties);
    });

    it('should select selectedProperty', () => {
      expect(selectSelectedProperty(mockState)).toEqual(mockProperties[0]);
    });

    it('should select loading', () => {
      expect(selectPropertiesLoading(mockState)).toBe(false);
    });

    it('should select error', () => {
      expect(selectPropertiesError(mockState)).toBe('Test error');
    });

    it('should select filters', () => {
      expect(selectPropertiesFilters(mockState)).toEqual({
        destination: 'Los Angeles',
        checkInDate: '2025-01-01',
        checkOutDate: '2025-01-05',
        guests: '4',
      });
    });
  });
});


// src/store/__tests__/bookingsSlice.test.ts
import { setupStore, type AppStore } from './testUtils';
import bookingsReducer, {
  fetchBookings,
  fetchBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  loadFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearError,
  resetBookingStatus,
  selectBookings,
  selectSelectedBooking,
  selectFavorites,
  selectBookingsLoading,
  selectBookingsError,
  selectBookingStatus,
} from '../slices/bookingsSlice';
import bookingService from '../../services/bookingService';

// Mock the bookingService
jest.mock('../../services/bookingService', () => ({
  __esModule: true,
  default: {
    getBookings: jest.fn(),
    getBookingById: jest.fn(),
    createBooking: jest.fn(),
    updateBookingStatus: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));

describe('bookingsSlice', () => {
  let store: AppStore;

  const mockBooking = {
    id: '1',
    property_id: 'prop1',
    traveler_id: 'user1',
    owner_id: 'owner1',
    check_in: '2025-01-01',
    check_out: '2025-01-05',
    number_of_guests: 4,
    total_price: '500',
    status: 'PENDING' as const,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  };

  const mockBookings = [
    mockBooking,
    {
      ...mockBooking,
      id: '2',
      status: 'ACCEPTED' as const,
    },
  ];

  beforeEach(() => {
    store = setupStore();
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    (localStorage.setItem as jest.Mock).mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().bookings;
      expect(state).toEqual({
        bookings: [],
        selectedBooking: null,
        favorites: [],
        loading: false,
        error: null,
        bookingStatus: 'idle',
      });
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      store = setupStore({
        bookings: {
          bookings: [],
          selectedBooking: null,
          favorites: [],
          loading: false,
          error: 'Test error',
          bookingStatus: 'idle',
        },
      } as any);

      store.dispatch(clearError());
      const state = store.getState().bookings;
      expect(state.error).toBeNull();
    });

    it('should handle resetBookingStatus', () => {
      store = setupStore({
        bookings: {
          bookings: [],
          selectedBooking: null,
          favorites: [],
          loading: false,
          error: 'Test error',
          bookingStatus: 'success',
        },
      } as any);

      store.dispatch(resetBookingStatus());
      const state = store.getState().bookings;
      expect(state.bookingStatus).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('favorites management', () => {
    const userId = 'user123';
    const propertyId = 'prop123';

    it('should handle addFavorite', () => {
      store.dispatch(addFavorite({ propertyId, userId }));
      const state = store.getState().bookings;
      expect(state.favorites).toContain(propertyId);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `favorites_${userId}`,
        JSON.stringify([propertyId])
      );
    });

    it('should not add duplicate favorites', () => {
      store.dispatch(addFavorite({ propertyId, userId }));
      store.dispatch(addFavorite({ propertyId, userId }));
      const state = store.getState().bookings;
      expect(state.favorites).toEqual([propertyId]);
    });

    it('should handle removeFavorite', () => {
      store = setupStore({
        bookings: {
          bookings: [],
          selectedBooking: null,
          favorites: [propertyId, 'prop456'],
          loading: false,
          error: null,
          bookingStatus: 'idle',
        },
      } as any);

      store.dispatch(removeFavorite({ propertyId, userId }));
      const state = store.getState().bookings;
      expect(state.favorites).not.toContain(propertyId);
      expect(state.favorites).toContain('prop456');
    });

    it('should handle toggleFavorite - add', () => {
      store.dispatch(toggleFavorite({ propertyId, userId }));
      const state = store.getState().bookings;
      expect(state.favorites).toContain(propertyId);
    });

    it('should handle toggleFavorite - remove', () => {
      store = setupStore({
        bookings: {
          bookings: [],
          selectedBooking: null,
          favorites: [propertyId],
          loading: false,
          error: null,
          bookingStatus: 'idle',
        },
      } as any);

      store.dispatch(toggleFavorite({ propertyId, userId }));
      const state = store.getState().bookings;
      expect(state.favorites).not.toContain(propertyId);
    });
  });

  describe('loadFavorites async thunk', () => {
    it('should load favorites from localStorage', async () => {
      const favorites = ['prop1', 'prop2', 'prop3'];
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(favorites)
      );

      await store.dispatch(loadFavorites('user123'));

      const state = store.getState().bookings;
      expect(state.favorites).toEqual(favorites);
    });

    it('should handle empty favorites', async () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      await store.dispatch(loadFavorites('user123'));

      const state = store.getState().bookings;
      expect(state.favorites).toEqual([]);
    });
  });

  describe('fetchBookings async thunk', () => {
    it('should handle successful fetch', async () => {
      (bookingService.getBookings as jest.Mock).mockResolvedValue({
        data: mockBookings,
      });

      await store.dispatch(fetchBookings(undefined));

      const state = store.getState().bookings;
      expect(state.bookings).toEqual(mockBookings);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch with status filter', async () => {
      (bookingService.getBookings as jest.Mock).mockResolvedValue({
        data: [mockBookings[1]],
      });

      await store.dispatch(fetchBookings('ACCEPTED'));

      expect(bookingService.getBookings).toHaveBeenCalledWith('ACCEPTED');
    });

    it('should handle fetch failure', async () => {
      const errorMessage = 'Failed to fetch bookings';
      (bookingService.getBookings as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchBookings(undefined));

      const state = store.getState().bookings;
      expect(state.bookings).toEqual([]);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchBookingById async thunk', () => {
    it('should handle successful fetch', async () => {
      (bookingService.getBookingById as jest.Mock).mockResolvedValue({
        data: mockBooking,
      });

      await store.dispatch(fetchBookingById('1'));

      const state = store.getState().bookings;
      expect(state.selectedBooking).toEqual(mockBooking);
      expect(state.loading).toBe(false);
    });

    it('should handle fetch failure', async () => {
      const errorMessage = 'Booking not found';
      (bookingService.getBookingById as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchBookingById('999'));

      const state = store.getState().bookings;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('createBooking async thunk', () => {
    const newBookingData = {
      property_id: 'prop1',
      check_in_date: '2025-01-01',
      check_out_date: '2025-01-05',
      guests: 4,
      total_price: 500,
    };

    it('should handle successful booking creation', async () => {
      (bookingService.createBooking as jest.Mock).mockResolvedValue({
        data: mockBooking,
      });

      await store.dispatch(createBooking(newBookingData));

      const state = store.getState().bookings;
      expect(state.bookings).toContain(mockBooking);
      expect(state.bookingStatus).toBe('success');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle booking creation failure', async () => {
      const errorMessage = 'Property not available';
      (bookingService.createBooking as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(createBooking(newBookingData));

      const state = store.getState().bookings;
      expect(state.bookingStatus).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });

    it('should set status to pending while creating', () => {
      (bookingService.createBooking as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(createBooking(newBookingData));

      const state = store.getState().bookings;
      expect(state.bookingStatus).toBe('pending');
      expect(state.loading).toBe(true);
    });
  });

  describe('updateBookingStatus async thunk', () => {
    beforeEach(() => {
      store = setupStore({
        bookings: {
          bookings: mockBookings,
          selectedBooking: null,
          favorites: [],
          loading: false,
          error: null,
          bookingStatus: 'idle',
        },
      } as any);
    });

    it('should handle successful status update', async () => {
      (bookingService.updateBookingStatus as jest.Mock).mockResolvedValue({
        data: { ...mockBooking, status: 'ACCEPTED' },
      });

      await store.dispatch(
        updateBookingStatus({ id: '1', status: 'ACCEPTED' })
      );

      const state = store.getState().bookings;
      const updatedBooking = state.bookings.find((b) => b.id === '1');
      expect(updatedBooking?.status).toBe('ACCEPTED');
    });

    it('should handle update failure', async () => {
      const errorMessage = 'Update failed';
      (bookingService.updateBookingStatus as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        updateBookingStatus({ id: '1', status: 'ACCEPTED' })
      );

      const state = store.getState().bookings;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('cancelBooking async thunk', () => {
    beforeEach(() => {
      store = setupStore({
        bookings: {
          bookings: mockBookings,
          selectedBooking: null,
          favorites: [],
          loading: false,
          error: null,
          bookingStatus: 'idle',
        },
      } as any);
    });

    it('should handle successful cancellation', async () => {
      (bookingService.cancelBooking as jest.Mock).mockResolvedValue({
        data: { ...mockBooking, status: 'CANCELLED' },
      });

      await store.dispatch(
        cancelBooking({ id: '1', reason: 'Changed plans' })
      );

      const state = store.getState().bookings;
      const cancelledBooking = state.bookings.find((b) => b.id === '1');
      expect(cancelledBooking?.status).toBe('CANCELLED');
    });

    it('should handle cancellation failure', async () => {
      const errorMessage = 'Cancellation failed';
      (bookingService.cancelBooking as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(cancelBooking({ id: '1' }));

      const state = store.getState().bookings;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    const mockState = {
      bookings: {
        bookings: mockBookings,
        selectedBooking: mockBooking,
        favorites: ['prop1', 'prop2'],
        loading: false,
        error: 'Test error',
        bookingStatus: 'success' as const,
      },
    };

    it('should select bookings', () => {
      expect(selectBookings(mockState)).toEqual(mockBookings);
    });

    it('should select selectedBooking', () => {
      expect(selectSelectedBooking(mockState)).toEqual(mockBooking);
    });

    it('should select favorites', () => {
      expect(selectFavorites(mockState)).toEqual(['prop1', 'prop2']);
    });

    it('should select loading', () => {
      expect(selectBookingsLoading(mockState)).toBe(false);
    });

    it('should select error', () => {
      expect(selectBookingsError(mockState)).toBe('Test error');
    });

    it('should select bookingStatus', () => {
      expect(selectBookingStatus(mockState)).toBe('success');
    });
  });
});


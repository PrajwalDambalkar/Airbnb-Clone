// services/bookingService.ts
import api from './api';

export interface Booking {
  id: string; // MongoDB ObjectId
  property_id: string; // MongoDB ObjectId
  traveler_id: string; // MongoDB ObjectId
  owner_id: string; // MongoDB ObjectId
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_price: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  party_type?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Property details (when joined)
  property_name?: string;
  city?: string;
  state?: string;
  address?: string;
  images?: string[];
  // User details (when joined)
  traveler_name?: string;
  traveler_email?: string;
  owner_name?: string;
  owner_email?: string;
}

export interface CreateBookingData {
  property_id: string; // MongoDB ObjectId
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_price: number;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: Booking;
  count?: number;
}

export interface BookingsListResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

const bookingService = {
  // Create a new booking
  createBooking: async (bookingData: CreateBookingData): Promise<BookingResponse> => {
    const response = await api.post('/api/bookings', bookingData);
    return response.data;
  },

  // Get all bookings for the logged-in user
  getBookings: async (status?: string): Promise<BookingsListResponse> => {
    const params = status ? { status } : {};
    const response = await api.get('/api/bookings', { params });
    return response.data;
  },

  // Get single booking by ID
  getBookingById: async (id: string): Promise<BookingResponse> => {
    const response = await api.get(`/api/bookings/${id}`);
    return response.data;
  },

  // Update booking status (for owner to accept/reject)
  updateBookingStatus: async (id: string, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED'): Promise<BookingResponse> => {
    const response = await api.put(`/api/bookings/${id}/status`, { status });
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (id: string, cancellation_reason?: string): Promise<BookingResponse> => {
    const response = await api.put(`/api/bookings/${id}/cancel`, { cancellation_reason });
    return response.data;
  },

  // Get booked dates for a property (public endpoint)
  getPropertyBookedDates: async (propertyId: string | number) => {
    const response = await api.get(`/api/bookings/property/${propertyId}/booked-dates`);
    return response.data;
  },
};

export default bookingService;

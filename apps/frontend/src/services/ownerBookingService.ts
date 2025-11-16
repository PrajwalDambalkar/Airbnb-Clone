// src/services/ownerBookingService.ts
import api from './api';

export interface OwnerBooking {
  id: string; // MongoDB ObjectId
  traveler_id: string; // MongoDB ObjectId
  property_id: string; // MongoDB ObjectId
  owner_id: string; // MongoDB ObjectId
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_price: number;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED';
  party_type: string;
  cancelled_by: string | null; // 'traveler' or 'owner'
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  property_name: string;
  city: string;
  state: string;
  images: string;
  guest_name: string;
  guest_email: string;
}

export interface BookingStats {
  pending_count: number;
  confirmed_count: number;
  cancelled_count: number;
  total_bookings: number;
  total_revenue: number;
  pending_revenue: number;
}

export interface GetBookingsParams {
  status?: string;
  propertyId?: string; // MongoDB ObjectId
  search?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

// Get all bookings for owner
export const getOwnerBookings = async (params?: GetBookingsParams) => {
  const response = await api.get('/api/bookings/owner/all', { params });
  return response.data;
};

// Get booking statistics
export const getOwnerBookingStats = async () => {
  const response = await api.get('/api/bookings/owner/stats');
  return response.data;
};

// Get single booking details
export const getBookingDetails = async (id: string) => {
  const response = await api.get(`/api/bookings/owner/${id}`);
  return response.data;
};

// Approve a pending booking
export const approveBooking = async (id: string) => {
  const response = await api.put(`/api/bookings/owner/${id}/approve`);
  return response.data;
};

// Reject a pending booking
export const rejectBooking = async (id: string, reason?: string) => {
  const response = await api.put(`/api/bookings/owner/${id}/reject`, { reason });
  return response.data;
};

// Cancel a confirmed booking
export const cancelBooking = async (id: string, reason: string) => {
  const response = await api.put(`/api/bookings/owner/${id}/cancel`, { reason });
  return response.data;
};

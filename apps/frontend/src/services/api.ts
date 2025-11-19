// src/services/api.ts
// Axios instance and API service functions - used for making HTTP requests to the backend API.
import axios from 'axios';

// Microservices URLs
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const OWNER_SERVICE_URL = import.meta.env.VITE_OWNER_SERVICE_URL || 'http://localhost:5002';
const PROPERTY_SERVICE_URL = import.meta.env.VITE_PROPERTY_SERVICE_URL || 'http://localhost:5003';
const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:5004';
const TRAVELER_SERVICE_URL = import.meta.env.VITE_TRAVELER_SERVICE_URL || 'http://localhost:5005';

// For backward compatibility
const API_BASE_URL = import.meta.env.VITE_API_URL || BACKEND_URL;

// Helper function to create axios instance with common config
const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true, // Important for session cookies!
    timeout: 300000, // 5 minute timeout for AI agent requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add response interceptor to handle errors gracefully
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Don't log 401 errors as they're expected for unauthenticated users
      if (error.response?.status !== 401) {
        console.error('API Error:', error);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create axios instances for each microservice
const backendAPI = createAxiosInstance(BACKEND_URL);
const ownerAPI = createAxiosInstance(OWNER_SERVICE_URL);
const propertyAPI = createAxiosInstance(PROPERTY_SERVICE_URL);
const bookingAPI = createAxiosInstance(BOOKING_SERVICE_URL);
const travelerAPI = createAxiosInstance(TRAVELER_SERVICE_URL);

// Default API instance (for backward compatibility)
const api = backendAPI;

// Export all API instances
export { backendAPI, ownerAPI, propertyAPI, bookingAPI, travelerAPI };

// Types
export interface User {
  id: string; // MongoDB ObjectId
  name: string;
  email: string;
  role: 'traveler' | 'owner';
  phone_number?: string;
  city?: string;
  state?: string;
  country?: string;
  profile_picture?: string;
  created_at: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'traveler' | 'owner';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

// Auth API calls
export const authAPI = {
  // Signup
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  // Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export default api;
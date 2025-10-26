// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies!
  timeout: 300000, // 5 minute timeout for AI agent requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: number;
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
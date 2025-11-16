// src/services/profileService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Profile interface
export interface Profile {
  id: string; // MongoDB ObjectId
  name: string;
  email: string;
  role: 'traveler' | 'owner';
  phone_number?: string;
  about_me?: string;
  city?: string;
  state?: string;
  country?: string;
  languages?: string;
  gender?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

// Profile API calls
export const profileAPI = {
  // Get current user profile
  getProfile: async (): Promise<Profile> => {
    const response = await api.get('/api/profile');
    return response.data.profile;
  },

  // Update profile
  updateProfile: async (data: FormData): Promise<Profile> => {
    const response = await api.put('/api/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.profile;
  },
};

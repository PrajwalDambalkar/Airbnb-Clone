// src/services/profileService.ts
import { travelerAPI as api } from './api';

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

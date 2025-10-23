import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const propertyService = {
    // Get all properties with optional filters
    getAllProperties: async (filters?: {
        city?: string;
        min_price?: number;
        max_price?: number;
        guests?: number;
    }) => {
        try {
            const params = new URLSearchParams();
            
            if (filters?.city) params.append('city', filters.city);
            if (filters?.min_price) params.append('min_price', filters.min_price.toString());
            if (filters?.max_price) params.append('max_price', filters.max_price.toString());
            if (filters?.guests) params.append('guests', filters.guests.toString());

            const response = await axios.get(`${API_URL}/properties?${params.toString()}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch properties' };
        }
    },

    // Get single property by ID
    getPropertyById: async (id: string | number) => {
        try {
            const response = await axios.get(`${API_URL}/properties/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch property' };
        }
    }
};
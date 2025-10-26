// services/agentService.ts
import axios from 'axios';
import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AgentPlanRequest {
  booking_id: number;
  query?: string;
  preferences?: {
    budget?: string;
    interests?: string[];
    dietary_restrictions?: string[];
    mobility_needs?: {
      wheelchair?: boolean;
      elderly_friendly?: boolean;
      child_friendly?: boolean;
    };
  };
}

export interface TimeBlock {
  time: string;
  activity: string;
  description?: string;
}

export interface DayPlan {
  day_number: number;
  date: string;
  morning?: TimeBlock;
  afternoon?: TimeBlock;
  evening?: TimeBlock;
}

export interface ActivityCard {
  title: string;
  description?: string;
  address?: string;
  duration?: string;
  price_tier?: string;
  tags?: string[];
  accessibility?: {
    wheelchair?: boolean;
    child_friendly?: boolean;
  };
}

export interface Restaurant {
  name: string;
  cuisine?: string;
  dietary_tags?: string[];
  price_tier?: string;
  description?: string;
  address?: string;
}

export interface AgentPlanResponse {
  booking_id: number;
  destination: string;
  dates: {
    check_in: string;
    check_out: string;
  };
  itinerary: DayPlan[];
  activities: ActivityCard[];
  restaurants: Restaurant[];
  packing_list: string[];
  local_tips?: string[];
  weather_summary?: string;
  generated_at?: string;
}

const agentService = {
  /**
   * Generate a personalized travel plan
   */
  generatePlan: async (request: AgentPlanRequest): Promise<AgentPlanResponse> => {
    try {
      console.log('📡 [Frontend] Calling API:', '/api/agent/plan');
      console.log('📦 [Frontend] Request payload:', request);
      
      const response = await api.post<{ success: boolean; data: AgentPlanResponse }>(
        '/api/agent/plan',
        request
      );
      
      console.log('✅ [Frontend] API response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Generate plan error:', error);
      console.error('🔍 [Frontend] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  },

  /**
   * Process a natural language query
   */
  processQuery: async (query: string, bookingId: number): Promise<any> => {
    try {
      const response = await api.post('/api/agent/query', {
        query,
        booking_id: bookingId
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Process query error:', error);
      throw error;
    }
  }
};

export default agentService;


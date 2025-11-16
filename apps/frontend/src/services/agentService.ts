// services/agentService.ts
import api from './api';

export interface AgentPlanRequest {
  booking_id: string; // MongoDB ObjectId
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
  booking_id: string; // MongoDB ObjectId
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
  processQuery: async (query: string, bookingId: string): Promise<any> => {
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
  },

  /**
   * Send a chat message to the AI assistant
   */
  chat: async (request: { 
    message: string; 
    booking_id?: string; // MongoDB ObjectId
    conversation_history?: Array<{ role: string; content: string }>;
  }): Promise<{ message: string; data?: any }> => {
    try {
      console.log('📡 [Frontend] Calling API:', '/api/agent/chat');
      console.log('📦 [Frontend] Request payload:', {
        ...request,
        conversation_history: request.conversation_history ? `${request.conversation_history.length} messages` : 'none'
      });
      
      const response = await api.post<{ success: boolean; message: string; data?: any }>(
        '/api/agent/chat',
        request
      );
      
      console.log('✅ [Frontend] Chat response:', response.data);
      return {
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('❌ [Frontend] Chat error:', error);
      console.error('🔍 [Frontend] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }
};

export default agentService;


import axios, { AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Debug logging for API config
console.log('API Configuration:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Using API_BASE_URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    return Promise.reject(error);
  }
);

// Types for the new backend responses
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot';
  intent?: string;
  agent_used?: string;
  data?: any;
  actions?: any[];
  timestamp: Date;
  status?: 'loading' | 'success' | 'error';
  conversation_id?: string;
  follow_up_questions?: string[];
}

export interface ChatRouteRequest {
  query: string;
  userCards: string[];
}

export interface ChatResponse {
  conversation_id: string;
  timestamp: string;
  message: string;
  intent: string;
  agent_used: string;
  data?: {
    products?: ProductAnalysis[];
    flights?: FlightAnalysis[];
    grocery_items?: GroceryAnalysis[];
    cart?: CartItem[];
    total_savings?: number;
    best_deal?: ProductAnalysis;
    best_option?: FlightAnalysis;
  };
  follow_up_questions?: string[];
  actions?: Action[];
  status: string;
  error?: string;
}

export interface ProductAnalysis {
  product_title: string;
  platform: string;
  original_price: number;
  effective_price: number;
  credit_card_discount: number;
  total_discount: number;
  savings_percentage: number;
  recommended_card: string;
  card_benefit_description: string;
  confidence_score: number;
}

export interface FlightAnalysis {
  airline: string;
  flight_number: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  original_price: number;
  effective_price: number;
  credit_card_discount: number;
  recommended_card: string;
  card_benefit_description: string;
  confidence_score: number;
}

export interface GroceryAnalysis {
  product_title: string;
  platform: string;
  original_price: number;
  effective_price: number;
  unit_price: number;
  unit_measure: string;
  quantity_available: string;
  credit_card_discount: number;
  total_discount: number;
  savings_percentage: number;
  recommended_card: string;
  card_benefit_description: string;
}

export interface CartItem {
  product_name: string;
  platform: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  savings: number;
  card_used: string;
}

export interface Action {
  type: 'purchase' | 'book' | 'suggestion' | 'open_url' | 'add_to_cart';
  description: string;
  label?: string;
  data?: any;
  url?: string;
}

// Additional types for chat components
export interface ProductData {
  title: string;
  price: number;
  platform: string;
  url: string;
  image?: string;
}

export interface FlightData {
  airline: string;
  flightNumber: string;
  departure: {
    time: string;
    city: string;
    airport: string;
  };
  arrival: {
    time: string;
    city: string;
    airport: string;
  };
  duration: string;
  stops: string;
  price: number;
}

export interface GroceryData {
  title: string;
  price: number;
  platform: string;
  unit_price: number;
  unit_measure: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  architecture: string;
  environment: {
    production: boolean;
    development: boolean;
  };
  agents: Record<string, any>;
  runners: Record<string, any>;
  tools: Record<string, any>;
  components: {
    orchestrator: string;
    sessions: number;
  };
  error?: string;
}

export interface CreditCard {
  id: string;
  bank: string;
  card_name: string;
  key_features: string;
  joining_fee: string;
  annual_fee: string;
  welcome_offer: string;
  rewards_program: string;
  lounge_access: string;
  other_benefits: string;
  display_name: string;
}

export interface CreditCardsResponse {
  status: string;
  total_cards: number;
  credit_cards: CreditCard[];
}

// API Functions
export interface OrchestratedResponse {
  agent: 'groceries' | 'products' | 'flights';
  bestCard?: string;
  rationale?: string;
  details: any;
}

export const chatAPI = {
  sendRouted: async (request: ChatRouteRequest): Promise<OrchestratedResponse> => {
    try {
      const response: AxiosResponse<OrchestratedResponse> = await api.post('/chat/route', request);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export const healthAPI = {
  getStatus: async (): Promise<HealthStatus> => {
    console.log('🏥 healthAPI.getStatus: Calling URL:', `${API_BASE_URL}/health`);
    try {
      const response: AxiosResponse<HealthStatus> = await api.get('/health');
      console.log('🏥 healthAPI.getStatus: Response:', response);
      return response.data;
    } catch (error: any) {
      console.error('🏥 healthAPI.getStatus: Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });

      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network Error: Unable to connect to backend server. Please check if the backend is running.');
      }
      if (error.message && error.message.includes('CORS')) {
        throw new Error('CORS Error: Backend server is blocking requests from this origin.');
      }
      throw error;
    }
  },
};

export const creditCardsAPI = {
  getAll: async (): Promise<CreditCardsResponse> => {
    try {
      console.log('💳 Fetching credit cards');
      const response: AxiosResponse<CreditCardsResponse> = await api.get('/credit-cards');
      console.log('💳 Credit cards response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💳 Credit cards API error:', error);
      throw error;
    }
  },
};

export const capabilitiesAPI = {
  getCapabilities: async (): Promise<any> => {
    try {
      console.log('🔧 Fetching capabilities');
      const response = await api.get('/capabilities');
      console.log('🔧 Capabilities response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔧 Capabilities API error:', error);
      throw error;
    }
  },
};

export const toolsAPI = {
  getAvailableTools: async (): Promise<any> => {
    try {
      console.log('🛠️ Fetching available tools');
      const response = await api.get('/tools');
      console.log('🛠️ Tools response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🛠️ Tools API error:', error);
      throw error;
    }
  },
};

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility function to format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Utility function to get agent display name
export const getAgentDisplayName = (agent: string): string => {
  const agentNames: Record<string, string> = {
    'product': 'Product Analysis',
    'grocery': 'Grocery Analysis',
    'flight': 'Flight Analysis',
    'orchestrator': 'Smart Assistant',
  };
  return agentNames[agent] || agent;
};

// Utility function to get intent display name
export const getIntentDisplayName = (intent: string): string => {
  const intentNames: Record<string, string> = {
    'product_search': 'Product Search',
    'grocery_search': 'Grocery Search',
    'flight_search': 'Flight Search',
    'general_question': 'General Question',
  };
  return intentNames[intent] || intent;
};
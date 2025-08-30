import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  // Add auth token if needed
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Updated interfaces to match the new backend
export interface ChatRequest {
  query: string;
  credit_card?: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  conversation_id: string;
  timestamp: string;
  message: string;
  intent: string;
  agent_used: string;
  data?: Record<string, any>;
  follow_up_questions?: string[];
  actions?: Action[];
  status: string;
  error?: string;
}

export interface Action {
  type: string;
  description: string;
  data?: any;
  label?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot';
  intent?: string;
  agent_used?: string;
  data?: any;
  actions?: Action[];
  timestamp: Date;
  status?: 'loading' | 'success' | 'error';
  conversation_id?: string;
  follow_up_questions?: string[];
}

export interface ProductData {
  title: string;
  price: number;
  originalPrice?: number;
  platform: string;
  image?: string;
  rating?: number;
  savings?: number;
  creditCardBenefit?: string;
  url: string;
  description?: string;
  brand?: string;
  availability?: string;
}

export interface FlightData {
  airline: string;
  flightNumber: string;
  departure: {
    city: string;
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    city: string;
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  price: number;
  stops: number;
  aircraft?: string;
  departure_time?: string;
  arrival_time?: string;
  departure_date?: string;
  arrival_date?: string;
}

export interface GroceryData {
  name: string;
  options: ProductData[];
  selectedIndex: number;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  platform?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  architecture: string;
  environment: Record<string, boolean>;
  agents: Record<string, any>;
  runners: Record<string, any>;
  tools: Record<string, any>;
}

export interface Capabilities {
  domains: Record<string, any>;
  supported_queries: Record<string, string[]>;
  credit_cards_supported: boolean;
  platforms: Record<string, string[]>;
  features: string[];
}

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/chat', request);
    return response.data;
  },
 
  getSessionInfo: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },
};

export const healthAPI = {
  getStatus: async (): Promise<HealthStatus> => {
    const response = await api.get('/health');
    return response.data;
  },
 
  getCapabilities: async (): Promise<Capabilities> => {
    const response = await api.get('/capabilities');
    return response.data;
  },
 
  getTools: async (): Promise<any> => {
    const response = await api.get('/tools');
    return response.data;
  },
};

export const testAPI = {
  testAgent: async (domain: string, query: string = "test query"): Promise<any> => {
    const response = await api.post(`/test-agent/${domain}`, { query });
    return response.data;
  },
};
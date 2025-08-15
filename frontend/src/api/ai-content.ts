import axios from '@/http/axios';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: string;
  is_available: boolean;
  max_tokens: number;
  cost_per_token: number;
  provider?: string;
  version?: string;
}

export interface AIChatRequest {
  model_id: string;
  message: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  model_id: string;
  message: string;
  tokens_used: number;
  cost: number;
  timestamp: string;
  finish_reason?: string;
}

export interface AIAnalysisRequest {
  analysis_type: 'sentiment' | 'keywords' | 'summarization' | 'translation' | 'grammar_check' | 'tone_analysis';
  content: string;
  model_id?: string;
  options?: Record<string, any>;
}

export interface AIAnalysisResponse {
  analysis_type: string;
  content: string;
  results: Record<string, any>;
  timestamp: string;
  model_used?: string;
  confidence?: number;
}

export interface AIModelMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  total_cost: number;
  tokens_used: number;
  last_updated: string;
  model_breakdown?: Record<string, number>;
}

export interface AIModelConfig {
  default_model: string;
  max_tokens_per_request: number;
  temperature: number;
  enable_streaming: boolean;
  rate_limit_per_minute: number;
  cost_limit_per_day: number;
  allowed_models?: string[];
}

export interface AIConversation {
  id: string;
  user_id: number;
  model_id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    tokens_used?: number;
    cost?: number;
  }>;
  created_at: string;
  updated_at: string;
  total_tokens: number;
  total_cost: number;
}

class AIContentAPI {
  // AI Models
  async listModels(): Promise<AIModel[]> {
    const response = await axios.get('/ai-content/models');
    return response.data;
  }

  async getModel(modelId: string): Promise<AIModel> {
    const response = await axios.get(`/api/v1/ai-content/models/${modelId}`);
    return response.data;
  }

  // AI Chat
  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const response = await axios.post('/ai-content/chat', request);
    return response.data;
  }

  // AI Analysis
  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const response = await axios.post('/ai-content/analyze', request);
    return response.data;
  }

  // AI Metrics
  async getMetrics(modelId?: string): Promise<AIModelMetrics> {
    const params = modelId ? { model_id: modelId } : {};
    const response = await axios.get('/ai-content/metrics', { params });
    return response.data;
  }

  // AI Configuration
  async getConfig(): Promise<AIModelConfig> {
    const response = await axios.get('/ai-content/config');
    return response.data;
  }

  // AI Conversations (if implemented)
  async listConversations(): Promise<AIConversation[]> {
    const response = await axios.get('/ai-content/conversations');
    return response.data;
  }

  async getConversation(conversationId: string): Promise<AIConversation> {
    const response = await axios.get(`/api/v1/ai-content/conversations/${conversationId}`);
    return response.data;
  }

  async createConversation(modelId: string, initialMessage?: string): Promise<AIConversation> {
    const response = await axios.post('/ai-content/conversations', {
      model_id: modelId,
      initial_message: initialMessage
    });
    return response.data;
  }

  async addMessageToConversation(conversationId: string, message: string): Promise<AIConversation> {
    const response = await axios.post(`/api/v1/ai-content/conversations/${conversationId}/messages`, {
      content: message
    });
    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await axios.delete(`/api/v1/ai-content/conversations/${conversationId}`);
  }
}

export const aiContentApi = new AIContentAPI(); 
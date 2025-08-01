export interface VoiceEngine {
  id: string;
  name: string;
  type: 'google' | 'web-speech';
  isAvailable: boolean;
  cost?: number;
}

export interface VoiceConfig {
  engine: VoiceEngine;
  voice: string;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
  cost?: number;
}

export interface ApiKeys {
  openai?: string;
  googleCloud?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface UserSettings {
  voiceEngine: string;
  voiceConfig: VoiceConfig;
  apiKeys: ApiKeys;
  autoMode: boolean;
}

export interface DashboardStats {
  totalMessages: number;
  totalCost: number;
  averageResponseTime: number;
  voiceEngineUsage: Record<string, number>;
}
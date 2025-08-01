import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage, UserSettings, DashboardStats } from '../types';

export class SupabaseService {
  private client: SupabaseClient | null = null;

  initialize(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async signUp(email: string, password: string) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    if (!this.client) return null;
    
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  async saveChatMessage(message: ChatMessage) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client
      .from('chat_messages')
      .insert([{
        id: message.id,
        text: message.text,
        type: message.type,
        timestamp: message.timestamp.toISOString(),
        audio_url: message.audioUrl,
        cost: message.cost,
        user_id: (await this.getCurrentUser())?.id,
      }]);

    if (error) throw error;
    return data;
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.client
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      text: row.text,
      type: row.type,
      timestamp: new Date(row.timestamp),
      audioUrl: row.audio_url,
      cost: row.cost,
    }));
  }

  async saveUserSettings(settings: UserSettings) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.client
      .from('user_settings')
      .upsert([{
        user_id: user.id,
        voice_engine: settings.voiceEngine,
        voice_config: settings.voiceConfig,
        api_keys: settings.apiKeys,
        auto_mode: settings.autoMode,
        updated_at: new Date().toISOString(),
      }]);

    if (error) throw error;
    return data;
  }

  async getUserSettings(): Promise<UserSettings | null> {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await this.client
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return {
      voiceEngine: data.voice_engine,
      voiceConfig: data.voice_config,
      apiKeys: data.api_keys,
      autoMode: data.auto_mode,
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: messages, error } = await this.client
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalMessages = messages.length;
    const totalCost = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
    
    // Calculate average response time (placeholder logic)
    const averageResponseTime = 1500; // milliseconds

    // Voice engine usage stats
    const voiceEngineUsage: Record<string, number> = {};
    // This would be calculated based on actual usage logs

    return {
      totalMessages,
      totalCost,
      averageResponseTime,
      voiceEngineUsage,
    };
  }

  isAvailable(): boolean {
    return !!this.client;
  }
}

export const supabaseService = new SupabaseService();
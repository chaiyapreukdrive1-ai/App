import OpenAI from 'openai';
import { ChatMessage } from '../types';

export class OpenAIService {
  private client: OpenAI | null = null;

  setApiKey(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const openAIMessages = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text,
      }));

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are Yuri, a helpful AI assistant that speaks Thai fluently. You are warm, friendly, and knowledgeable. Always respond in Thai unless specifically asked to use another language.'
          },
          ...openAIMessages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'ขออภัย ฉันไม่สามารถตอบได้ในขณะนี้';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('ไม่สามารถเชื่อมต่อกับ OpenAI ได้');
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }
}
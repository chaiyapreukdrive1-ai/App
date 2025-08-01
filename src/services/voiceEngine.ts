import { VoiceEngine, VoiceConfig } from '../types';

export class GoogleCloudSpeechService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesizeSpeech(text: string, config: VoiceConfig): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Cloud API key not configured');
    }

    try {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: config.language,
            name: config.voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: config.pitch,
            speakingRate: config.rate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Cloud TTS failed: ${response.statusText}`);
      }

      const data = await response.json();
      return `data:audio/mp3;base64,${data.audioContent}`;
    } catch (error) {
      console.error('Google Cloud TTS error:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export class WebSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    if (this.voices.length === 0) {
      // Voices might not be loaded yet
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
      };
    }
  }

  async synthesizeSpeech(text: string, config: VoiceConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find the Thai female voice
        const thaiVoice = this.voices.find(voice => 
          voice.lang.startsWith('th') && voice.name.toLowerCase().includes('female')
        ) || this.voices.find(voice => voice.lang.startsWith('th'));

        if (thaiVoice) {
          utterance.voice = thaiVoice;
        }

        utterance.rate = config.rate;
        utterance.pitch = config.pitch;
        utterance.volume = config.volume;

        utterance.onend = () => {
          resolve('web-speech-completed');
        };

        utterance.onerror = (error) => {
          reject(new Error(`Web Speech API error: ${error.error}`));
        };

        this.synthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('th'));
  }

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
}

export class VoiceEngineManager {
  private googleService: GoogleCloudSpeechService;
  private webSpeechService: WebSpeechService;
  private currentEngine: VoiceEngine | null = null;
  private autoMode: boolean = true;

  constructor() {
    this.googleService = new GoogleCloudSpeechService();
    this.webSpeechService = new WebSpeechService();
  }

  getAvailableEngines(): VoiceEngine[] {
    return [
      {
        id: 'google-neural',
        name: 'Google Neural (th-TH-Kanchana)',
        type: 'google',
        isAvailable: this.googleService.isAvailable(),
        cost: 0.000016, // per character
      },
      {
        id: 'google-standard',
        name: 'Google Standard (th-TH-Standard-A)',
        type: 'google',
        isAvailable: this.googleService.isAvailable(),
        cost: 0.000004, // per character
      },
      {
        id: 'web-speech',
        name: 'Web Speech (Thai Female)',
        type: 'web-speech',
        isAvailable: this.webSpeechService.isAvailable(),
        cost: 0, // free
      },
    ];
  }

  setApiKey(apiKey: string) {
    this.googleService.setApiKey(apiKey);
  }

  setEngine(engine: VoiceEngine) {
    this.currentEngine = engine;
  }

  setAutoMode(enabled: boolean) {
    this.autoMode = enabled;
  }

  async synthesizeSpeech(text: string, config: VoiceConfig): Promise<string> {
    let engine = this.currentEngine;

    // Auto mode: fallback logic
    if (this.autoMode) {
      const engines = this.getAvailableEngines();
      engine = engines.find(e => e.isAvailable) || engines[engines.length - 1];
    }

    if (!engine) {
      throw new Error('No voice engine available');
    }

    try {
      if (engine.type === 'google') {
        return await this.googleService.synthesizeSpeech(text, config);
      } else {
        return await this.webSpeechService.synthesizeSpeech(text, config);
      }
    } catch (error) {
      // Fallback to web speech if Google fails and auto mode is enabled
      if (this.autoMode && engine.type === 'google') {
        console.warn('Google TTS failed, falling back to Web Speech API');
        return await this.webSpeechService.synthesizeSpeech(text, config);
      }
      throw error;
    }
  }
}
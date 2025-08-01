import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { VoiceEngineManager } from '../services/voiceEngine';
import { OpenAIService } from '../services/openai';
import { supabaseService } from '../services/supabase';
import { ChatMessage, UserSettings, VoiceConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface VoiceChatProps {
  voiceManager: VoiceEngineManager;
  openAIService: OpenAIService;
  userSettings: UserSettings | null;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  voiceManager, 
  openAIService, 
  userSettings 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'th-TH';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Load chat history
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await supabaseService.getChatHistory();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: inputText.trim(),
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Save user message
      await supabaseService.saveChatMessage(userMessage);

      // Get AI response
      const response = await openAIService.generateResponse([...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        text: response,
        type: 'assistant',
        timestamp: new Date(),
      };

      // Generate speech for the response
      if (userSettings?.voiceConfig) {
        try {
          const audioUrl = await voiceManager.synthesizeSpeech(response, userSettings.voiceConfig);
          assistantMessage.audioUrl = audioUrl;
          
          // Calculate cost (rough estimate)
          const engine = voiceManager.getAvailableEngines().find(e => e.id === userSettings.voiceEngine);
          if (engine?.cost) {
            assistantMessage.cost = response.length * engine.cost;
          }
        } catch (audioError) {
          console.error('Failed to generate speech:', audioError);
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message
      await supabaseService.saveChatMessage(assistantMessage);

      // Auto-play the response
      if (assistantMessage.audioUrl && assistantMessage.audioUrl !== 'web-speech-completed') {
        playAudio(assistantMessage.audioUrl);
      }

    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        text: 'ขออภัย เกิดข้อผิดพลาดในการตอบสนอง กรุณาลองใหม่อีกครั้ง',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setIsSpeaking(true);

    audio.onended = () => {
      setIsSpeaking(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setIsSpeaking(false);
      setCurrentAudio(null);
      console.error('Failed to play audio');
    };

    audio.play().catch(error => {
      console.error('Audio play failed:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
    });
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">🎙️ Voice Chat</h1>
          <p className="text-gray-600 mt-1">
            พูดคุยกับ Yuri AI ด้วยเสียงภาษาไทย
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">เริ่มการสนทนา</h3>
              <p>พิมพ์ข้อความหรือใช้ไมโครโฟนเพื่อเริ่มพูดคุยกับ Yuri</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.audioUrl && message.audioUrl !== 'web-speech-completed' && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className="mt-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      เล่นเสียง
                    </button>
                  )}
                  {message.cost && (
                    <p className="text-xs text-gray-400 mt-1">
                      ค่าใช้จ่าย: ${message.cost.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-500">Yuri กำลังคิด...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                disabled={isProcessing}
              />
            </div>
            
            {/* Voice Recording Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`p-3 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white voice-wave'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Audio Control Button */}
            {isSpeaking && (
              <button
                onClick={stopAudio}
                className="p-3 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className={`p-3 rounded-lg transition-colors ${
                inputText.trim() && !isProcessing
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {isListening && (
            <div className="mt-2 text-center">
              <span className="text-sm text-red-600 font-medium">
                🎤 กำลังฟัง... พูดได้เลย
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
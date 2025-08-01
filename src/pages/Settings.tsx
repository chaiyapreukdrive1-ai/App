import React, { useState, useEffect } from 'react';
import { Key, Save, TestTube, Volume2, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react';
import { VoiceEngineManager } from '../services/voiceEngine';
import { OpenAIService } from '../services/openai';
import { supabaseService } from '../services/supabase';
import { UserSettings, VoiceConfig, ApiKeys } from '../types';

interface SettingsProps {
  voiceManager: VoiceEngineManager;
  openAIService: OpenAIService;
  userSettings: UserSettings | null;
  onSettingsUpdate: (settings: UserSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  voiceManager,
  openAIService,
  userSettings,
  onSettingsUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('voice');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    googleCloud: '',
    supabaseUrl: '',
    supabaseKey: '',
  });
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    engine: { id: 'web-speech', name: 'Web Speech', type: 'web-speech', isAvailable: true },
    voice: 'th-TH-Standard-A',
    language: 'th-TH',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  const [autoMode, setAutoMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testMessage, setTestMessage] = useState('สวัสดีครับ ยินดีที่ได้รู้จัก');

  useEffect(() => {
    if (userSettings) {
      setApiKeys(userSettings.apiKeys);
      setVoiceConfig(userSettings.voiceConfig);
      setAutoMode(userSettings.autoMode);
    }
  }, [userSettings]);

  const availableEngines = voiceManager.getAvailableEngines();

  const voiceOptions = {
    'google-neural': [
      { value: 'th-TH-Kanchana', label: 'Kanchana (Neural - คุณภาพสูงสุด)' },
    ],
    'google-standard': [
      { value: 'th-TH-Standard-A', label: 'Standard-A (ราคาถูกกว่า)' },
    ],
    'web-speech': [
      { value: 'thai-female', label: 'Thai Female (ฟรี)' },
    ],
  };

  const handleApiKeyChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const handleVoiceConfigChange = (key: keyof VoiceConfig, value: any) => {
    setVoiceConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleEngineChange = (engineId: string) => {
    const engine = availableEngines.find(e => e.id === engineId);
    if (engine) {
      const defaultVoice = voiceOptions[engineId as keyof typeof voiceOptions]?.[0]?.value || '';
      setVoiceConfig(prev => ({
        ...prev,
        engine,
        voice: defaultVoice,
      }));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const newSettings: UserSettings = {
        voiceEngine: voiceConfig.engine.id,
        voiceConfig,
        apiKeys,
        autoMode,
      };

      await supabaseService.saveUserSettings(newSettings);
      
      // Apply settings to services
      if (apiKeys.googleCloud) {
        voiceManager.setApiKey(apiKeys.googleCloud);
      }
      if (apiKeys.openai) {
        openAIService.setApiKey(apiKeys.openai);
      }
      if (apiKeys.supabaseUrl && apiKeys.supabaseKey) {
        supabaseService.initialize(apiKeys.supabaseUrl, apiKeys.supabaseKey);
      }
      
      voiceManager.setAutoMode(autoMode);
      voiceManager.setEngine(voiceConfig.engine);
      
      onSettingsUpdate(newSettings);
      
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestVoice = async () => {
    try {
      await voiceManager.synthesizeSpeech(testMessage, voiceConfig);
      alert('ทดสอบเสียงสำเร็จ!');
    } catch (error) {
      console.error('Voice test failed:', error);
      alert('ไม่สามารถทดสอบเสียงได้ กรุณาตรวจสอบการตั้งค่า');
    }
  };

  const toggleShowApiKey = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'voice', name: 'Voice Engine', icon: Volume2 },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'general', name: 'General', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
          <p className="text-gray-600 mt-1">
            กำหนดค่า Voice Engine และ API Keys
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Voice Engine Tab */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Engine Selection</h3>
                  
                  {/* Auto Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto Mode</h4>
                      <p className="text-sm text-gray-600">
                        เปิดใช้งานการเปลี่ยน engine อัตโนมัติเมื่อ quota หมด
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoMode(!autoMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Engine Selection */}
                  <div className="space-y-3">
                    {availableEngines.map((engine) => (
                      <div
                        key={engine.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          voiceConfig.engine.id === engine.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleEngineChange(engine.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{engine.name}</h4>
                            <p className="text-sm text-gray-600">
                              Type: {engine.type} | Status: {engine.isAvailable ? 'Available' : 'Unavailable'}
                            </p>
                            {engine.cost && (
                              <p className="text-xs text-gray-500">Cost: ${engine.cost} per character</p>
                            )}
                          </div>
                          <div className={`w-4 h-4 rounded-full ${
                            voiceConfig.engine.id === engine.id ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Voice Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice
                      </label>
                      <select
                        value={voiceConfig.voice}
                        onChange={(e) => handleVoiceConfigChange('voice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {(voiceOptions[voiceConfig.engine.id as keyof typeof voiceOptions] || []).map((voice) => (
                          <option key={voice.value} value={voice.value}>
                            {voice.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={voiceConfig.language}
                        onChange={(e) => handleVoiceConfigChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="th-TH">ไทย (th-TH)</option>
                        <option value="en-US">English (en-US)</option>
                      </select>
                    </div>

                    {/* Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speed: {voiceConfig.rate}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceConfig.rate}
                        onChange={(e) => handleVoiceConfigChange('rate', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Pitch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pitch: {voiceConfig.pitch}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceConfig.pitch}
                        onChange={(e) => handleVoiceConfigChange('pitch', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Test Voice */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Message
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ข้อความทดสอบ"
                      />
                      <button
                        onClick={handleTestVoice}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys Configuration</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    เก็บ API Keys อย่างปลอดภัยใน Supabase Database
                  </p>

                  <div className="space-y-4">
                    {/* OpenAI API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenAI API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKeys.openai ? 'text' : 'password'}
                          value={apiKeys.openai || ''}
                          onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="sk-..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowApiKey('openai')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKeys.openai ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Google Cloud API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Cloud API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKeys.googleCloud ? 'text' : 'password'}
                          value={apiKeys.googleCloud || ''}
                          onChange={(e) => handleApiKeyChange('googleCloud', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="AIza..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowApiKey('googleCloud')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKeys.googleCloud ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Supabase URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supabase URL
                      </label>
                      <input
                        type="text"
                        value={apiKeys.supabaseUrl || ''}
                        onChange={(e) => handleApiKeyChange('supabaseUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>

                    {/* Supabase Anon Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supabase Anon Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKeys.supabaseKey ? 'text' : 'password'}
                          value={apiKeys.supabaseKey || ''}
                          onChange={(e) => handleApiKeyChange('supabaseKey', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="eyJ..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowApiKey('supabaseKey')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKeys.supabaseKey ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-save conversations</h4>
                        <p className="text-sm text-gray-600">
                          บันทึกการสนทนาอัตโนมัติลงในฐานข้อมูล
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Cost tracking</h4>
                        <p className="text-sm text-gray-600">
                          ติดตามค่าใช้จ่ายของการใช้งาน API
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Real-time monitoring</h4>
                        <p className="text-sm text-gray-600">
                          เปิดใช้งานการติดตามแบบเรียลไทม์
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
};
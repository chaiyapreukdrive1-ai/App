import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { VoiceChat } from './pages/VoiceChat';
import { ChatHistory } from './pages/ChatHistory';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { VoiceEngineManager } from './services/voiceEngine';
import { OpenAIService } from './services/openai';
import { supabaseService } from './services/supabase';
import { UserSettings } from './types';
import './index.css';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [voiceManager] = useState(() => new VoiceEngineManager());
  const [openAIService] = useState(() => new OpenAIService());
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        await loadUserSettings();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      const settings = await supabaseService.getUserSettings();
      if (settings) {
        setUserSettings(settings);
        
        // Apply settings to services
        if (settings.apiKeys.googleCloud) {
          voiceManager.setApiKey(settings.apiKeys.googleCloud);
        }
        if (settings.apiKeys.openai) {
          openAIService.setApiKey(settings.apiKeys.openai);
        }
        if (settings.apiKeys.supabaseUrl && settings.apiKeys.supabaseKey) {
          supabaseService.initialize(settings.apiKeys.supabaseUrl, settings.apiKeys.supabaseKey);
        }
        
        voiceManager.setAutoMode(settings.autoMode);
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    loadUserSettings();
  };

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
      setIsAuthenticated(false);
      setUserSettings(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Mobile header */}
          <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Yuri Voice AI</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/voice-chat" replace />} />
              <Route 
                path="/voice-chat" 
                element={
                  <VoiceChat 
                    voiceManager={voiceManager}
                    openAIService={openAIService}
                    userSettings={userSettings}
                  />
                } 
              />
              <Route path="/chat-history" element={<ChatHistory />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/settings" 
                element={
                  <Settings 
                    voiceManager={voiceManager}
                    openAIService={openAIService}
                    userSettings={userSettings}
                    onSettingsUpdate={setUserSettings}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};
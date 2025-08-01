import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, DollarSign, Volume2, Trash2, Search } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { ChatMessage } from '../types';

export const ChatHistory: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, selectedDate]);

  const loadChatHistory = async () => {
    try {
      const history = await supabaseService.getChatHistory();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDate) {
      const selected = new Date(selectedDate);
      filtered = filtered.filter(message => {
        const messageDate = new Date(message.timestamp);
        return messageDate.toDateString() === selected.toDateString();
      });
    }

    setFilteredMessages(filtered);
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const playAudio = (audioUrl: string) => {
    if (audioUrl && audioUrl !== 'web-speech-completed') {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    // This would require implementing a delete endpoint in Supabase
    console.log('Delete message:', messageId);
    // For now, just remove from local state
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'วันนี้';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'เมื่อวาน';
    } else {
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const totalCost = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
  const messagesByDate = groupMessagesByDate(filteredMessages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">💬 Chat History</h1>
          <p className="text-gray-600 mt-1">
            ประวัติการสนทนาทั้งหมดของคุณ
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">ข้อความทั้งหมด</p>
                <p className="text-2xl font-semibold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">ค่าใช้จ่ายรวม</p>
                <p className="text-2xl font-semibold text-gray-900">${totalCost.toFixed(6)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">วันที่ใช้งานล่าสุด</p>
                <p className="text-sm font-semibold text-gray-900">
                  {messages.length > 0 
                    ? new Date(messages[messages.length - 1].timestamp).toLocaleDateString('th-TH')
                    : 'ยังไม่มีข้อมูล'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">ค้นหา</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ค้นหาในข้อความ..."
                />
              </div>
            </div>
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-6">
          {Object.keys(messagesByDate).length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีประวัติการสนทนา</h3>
              <p className="mt-2 text-sm text-gray-500">
                เริ่มสนทนากับ Yuri AI เพื่อดูประวัติที่นี่
              </p>
            </div>
          ) : (
            Object.entries(messagesByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateMessages]) => (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">
                      {formatDate(date)}
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-75">
                              {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <div className="flex items-center space-x-1">
                              {message.audioUrl && message.audioUrl !== 'web-speech-completed' && (
                                <button
                                  onClick={() => playAudio(message.audioUrl!)}
                                  className="p-1 rounded hover:bg-white/20"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="p-1 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {message.cost && (
                            <p className="text-xs opacity-75 mt-1">
                              ค่าใช้จ่าย: ${message.cost.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
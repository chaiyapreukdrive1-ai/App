import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, DollarSign, MessageSquare, Clock, Wifi, WifiOff } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardStats();
    initializeRealTimeMonitoring();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const dashboardStats = await supabaseService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeRealTimeMonitoring = () => {
    // Simulate real-time connection status
    setConnectionStatus('connected');
    
    // Generate mock real-time data
    const generateRealtimeData = () => {
      const now = new Date();
      const data = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        messages: Math.floor(Math.random() * 20),
        cost: Math.random() * 0.01,
        responseTime: Math.floor(Math.random() * 2000) + 500,
      }));
      setRealtimeData(data);
    };

    generateRealtimeData();
    const interval = setInterval(generateRealtimeData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const voiceEngineData = [
    { name: 'Google Neural', value: 45, color: '#3B82F6' },
    { name: 'Google Standard', value: 30, color: '#10B981' },
    { name: 'Web Speech', value: 25, color: '#F59E0B' },
  ];

  const performanceData = [
    { metric: 'เวลาตอบสนองเฉลี่ย', value: '1.2 วินาที', trend: 'down', color: 'green' },
    { metric: 'อัตราความสำเร็จ', value: '99.5%', trend: 'up', color: 'green' },
    { metric: 'การใช้งาน API', value: '78%', trend: 'up', color: 'yellow' },
    { metric: 'ค่าใช้จ่ายต่อข้อความ', value: '$0.003', trend: 'down', color: 'green' },
  ];

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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
              <p className="text-gray-600 mt-1">
                การติดตามแบบเรียลไทม์และข้อมูลการใช้งาน
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">เชื่อมต่อแล้ว</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">ไม่ได้เชื่อมต่อ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ข้อความทั้งหมด</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalMessages || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ค่าใช้จ่ายรวม</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats?.totalCost || 0).toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">เวลาตอบสนองเฉลี่ย</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {((stats?.averageResponseTime || 0) / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">สถานะระบบ</p>
                <p className="text-2xl font-semibold text-green-600">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การใช้งานรายชั่วโมง</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Voice Engine Usage */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การใช้งาน Voice Engine</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={voiceEngineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {voiceEngineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {voiceEngineData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">เวลาตอบสนองแบบเรียลไทม์</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวชี้วัดประสิทธิภาพ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{metric.metric}</p>
                    <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    metric.color === 'green' ? 'bg-green-500' :
                    metric.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะระบบ</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">OpenAI API</span>
              </div>
              <span className="text-sm text-green-700">ปกติ</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Google Cloud TTS</span>
              </div>
              <span className="text-sm text-green-700">ปกติ</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Supabase Database</span>
              </div>
              <span className="text-sm text-green-700">ปกติ</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Web Speech API</span>
              </div>
              <span className="text-sm text-yellow-700">จำกัดการใช้งาน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
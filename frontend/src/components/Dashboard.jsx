import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Activity,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  BarChart3,
  Zap,
  Shield,
  User,
  RefreshCw,
  Eye,
  Plus,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Dashboard = () => {
  // State management
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [riskStatus, setRiskStatus] = useState('safe');

  // Mock data - replace with your actual data fetching
  const [dashboardData, setDashboardData] = useState({
    accounts: [
      { id: 'ftmo-001', name: 'FTMO Challenge', firm: 'FTMO', balance: 98750, dailyLimit: 5000 },
      { id: 'mff-002', name: 'MFF Phase 2', firm: 'MyForexFunds', balance: 205300, dailyLimit: 10000 }
    ],
    todayStats: {
      totalPnL: 2150.75,
      totalTrades: 8,
      winRate: 75,
      rMultiple: 1.85,
      bestTrade: 850.25,
      worstTrade: -125.50,
      activeStreak: 3
    },
    riskMetrics: {
      dailyDrawdown: 2.1,
      maxDailyDrawdown: 5.0,
      accountDrawdown: 1.25,
      maxAccountDrawdown: 10.0
    },
    recentTrades: [
      { id: 1, symbol: 'EURUSD', pnl: 450.75, time: '14:30', direction: 'buy' },
      { id: 2, symbol: 'GBPUSD', pnl: -125.25, time: '13:45', direction: 'sell' },
      { id: 3, symbol: 'USDJPY', pnl: 325.50, time: '12:15', direction: 'buy' },
      { id: 4, symbol: 'AUDUSD', pnl: 275.25, time: '11:30', direction: 'sell' },
      { id: 5, symbol: 'NZDUSD', pnl: 185.75, time: '10:45', direction: 'buy' }
    ],
    chartData: [
      { name: 'Mon', value: 150.25 },
      { name: 'Tue', value: 425.75 },
      { name: 'Wed', value: -125.50 },
      { name: 'Thu', value: 675.25 },
      { name: 'Fri', value: 850.75 },
      { name: 'Sat', value: 275.50 },
      { name: 'Sun', value: 425.25 }
    ]
  });

  const [realDashboardData, setRealDashboardData] = useState(dashboardData);

  // Load real data from localStorage
  const loadRealData = useCallback(async () => {
    try {
      const trades = JSON.parse(localStorage.getItem('trades') || '[]');
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      
      const today = new Date().toDateString();
      const todayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryDate || trade.createdAt).toDateString();
        return tradeDate === today;
      });

      const totalTrades = todayTrades.length;
      const totalPnL = todayTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
      const winningTrades = todayTrades.filter(trade => parseFloat(trade.pnl || 0) > 0);
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      const bestTrade = Math.max(...todayTrades.map(trade => parseFloat(trade.pnl || 0)), 0);
      const worstTrade = Math.min(...todayTrades.map(trade => parseFloat(trade.pnl || 0)), 0);

      const averageR = todayTrades.length > 0 ? 
        todayTrades.reduce((sum, trade) => sum + parseFloat(trade.rMultiple || 0), 0) / todayTrades.length : 0;

      const recentTrades = todayTrades.slice(-5).reverse().map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        pnl: parseFloat(trade.pnl || 0),
        time: new Date(trade.entryDate || trade.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        direction: trade.direction || 'buy'
      }));

      let activeStreak = 0;
      for (let i = 0; i < trades.length; i++) {
        if (parseFloat(trades[i].pnl || 0) > 0) {
          activeStreak++;
        } else {
          break;
        }
      }

      setRealDashboardData(prev => ({
        ...prev,
        accounts: accounts.length > 0 ? accounts : prev.accounts,
        todayStats: {
          totalPnL: Math.round(totalPnL * 100) / 100,
          totalTrades,
          winRate: Math.round(winRate * 100) / 100,
          rMultiple: Math.round(averageR * 100) / 100,
          bestTrade: Math.round(bestTrade * 100) / 100,
          worstTrade: Math.round(worstTrade * 100) / 100,
          activeStreak
        },
        recentTrades
      }));

    } catch (error) {
      console.error('Error loading real dashboard data:', error);
      setRealDashboardData(dashboardData);
    }
  }, [dashboardData]);

  useEffect(() => {
    loadRealData();
    window.updateDashboardData = loadRealData;
    
    const handleTradeUpdate = () => {
      setTimeout(loadRealData, 100);
    };

    window.addEventListener('tradesUpdated', handleTradeUpdate);

    return () => {
      window.removeEventListener('tradesUpdated', handleTradeUpdate);
      delete window.updateDashboardData;
    };
  }, [loadRealData]);

  // Update risk status based on data
  useEffect(() => {
    const { dailyDrawdown, maxDailyDrawdown, accountDrawdown, maxAccountDrawdown } = realDashboardData.riskMetrics;
    
    if (dailyDrawdown >= maxDailyDrawdown * 0.8 || accountDrawdown >= maxAccountDrawdown * 0.8) {
      setRiskStatus('danger');
    } else if (dailyDrawdown >= maxDailyDrawdown * 0.6 || accountDrawdown >= maxAccountDrawdown * 0.6) {
      setRiskStatus('warning');
    } else {
      setRiskStatus('safe');
    }
  }, [realDashboardData.riskMetrics]);

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Trading Dashboard
            </h1>
            <p className="text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              {realDashboardData.accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                  loadRealData();
                }, 1000);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Risk Alert Banner */}
      {riskStatus !== 'safe' && (
        <Card className={`mb-6 border-l-4 bg-black ${riskStatus === 'danger' ? 'border-red-500' : 'border-amber-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle size={20} className={`mr-2 ${riskStatus === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
              <span className={`font-medium ${riskStatus === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                {riskStatus === 'danger' ? 'CRITICAL: ' : 'WARNING: '}
                Approaching drawdown limits. Trade with caution.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {realDashboardData.todayStats.totalPnL > 0 ? '+' : ''}$
                {realDashboardData.todayStats.totalPnL.toLocaleString()}
              </div>
              <div className={`p-2 rounded-full ${realDashboardData.todayStats.totalPnL > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {realDashboardData.todayStats.totalPnL > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Today's P&L • {realDashboardData.todayStats.totalTrades} trades
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {realDashboardData.todayStats.winRate}%
              </div>
              <Badge variant="secondary" className="bg-gray-800 text-white">
                Streak: {realDashboardData.todayStats.activeStreak}
              </Badge>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Win Rate • Today's success rate
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {realDashboardData.todayStats.rMultiple > 0 ? '+' : ''}
                {realDashboardData.todayStats.rMultiple.toFixed(2)}R
              </div>
              <div className={`p-2 rounded-full ${realDashboardData.todayStats.rMultiple > 1 ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400'}`}>
                <Target size={20} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              R-Multiple • Risk-to-reward ratio
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                ${Math.abs(realDashboardData.todayStats.bestTrade).toLocaleString()}
              </div>
              <div className="p-2 rounded-full bg-blue-900/30 text-blue-400">
                <Award size={20} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Best Trade • Today's winner
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realDashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realDashboardData.recentTrades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${trade.pnl > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="font-medium text-white">{trade.symbol}</div>
                      <div className="text-xs text-gray-400">{trade.time}</div>
                    </div>
                  </div>
                  <div className={`font-medium ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-4">
        <Button 
          onClick={() => {
            if (window.openTradeForm) {
              window.openTradeForm();
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <DollarSign size={20} className="mr-2" />
          Add Trade
        </Button>
        
        <Button 
          variant="secondary"
          onClick={() => {
            if (window.navigateToPage) {
              window.navigateToPage('analytics');
            }
          }}
          className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
        >
          <BarChart3 size={20} className="mr-2" />
          View Analytics
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;

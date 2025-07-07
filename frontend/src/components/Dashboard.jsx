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
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';
import TradingButton from './ui/TradingButton';
import TradingCard from './ui/TradingCard';
import TradingCalendar from './TradingCalendar';
import { theme } from '../theme/theme';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Dashboard = () => {
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
      { id: 1, pair: 'EURUSD', direction: 'buy', pnl: 425.75, rMultiple: 2.1, time: '14:32' },
      { id: 2, pair: 'GBPJPY', direction: 'sell', pnl: -125.50, rMultiple: -0.6, time: '13:15' },
      { id: 3, pair: 'USDJPY', direction: 'buy', pnl: 310.25, rMultiple: 1.5, time: '12:08' }
    ]
  });

  // Use real data if available
  const [realDashboardData, setRealDashboardData] = useState(dashboardData);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load real data from localStorage
  const loadRealData = useCallback(() => {
    try {
      const trades = JSON.parse(localStorage.getItem('tradesync_trades') || '[]');
      const accounts = JSON.parse(localStorage.getItem('tradesync_accounts') || '[]');
      
      if (trades.length === 0) {
        console.log('No trades found, using mock data');
        setRealDashboardData(dashboardData);
        return;
      }

      // Calculate real metrics
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => parseFloat(t.pnl || 0) > 0);
      const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      
      const rMultiples = trades
        .filter(t => t.r_multiple || t.rMultiple)
        .map(t => parseFloat(t.r_multiple || t.rMultiple || 0));
      const averageR = rMultiples.length > 0 
        ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length 
        : 0;

      const bestTrade = Math.max(...trades.map(t => parseFloat(t.pnl || 0)));
      const worstTrade = Math.min(...trades.map(t => parseFloat(t.pnl || 0)));

      // Get recent trades
      const recentTrades = trades.slice(0, 3).map(trade => ({
        id: trade.id,
        pair: trade.instrument,
        pnl: parseFloat(trade.pnl || 0),
        rMultiple: parseFloat(trade.r_multiple || trade.rMultiple || 0),
        time: new Date(trade.created_at || trade.date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        direction: trade.direction || 'buy'
      }));

      // Calculate active streak
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

      console.log('Dashboard updated with real data:', { totalTrades, totalPnL, winRate });

    } catch (error) {
      console.error('Error loading real dashboard data:', error);
      setRealDashboardData(dashboardData);
    }
  }, [dashboardData]);

  // Load data on component mount and when trades update
  useEffect(() => {
    loadRealData();

    // Set up global update function
    window.updateDashboardData = loadRealData;

    // Listen for trade updates
    const handleTradeUpdate = () => {
      setTimeout(loadRealData, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('tradesUpdated', handleTradeUpdate);
    window.addEventListener('storage', handleTradeUpdate);

    return () => {
      window.removeEventListener('tradesUpdated', handleTradeUpdate);
      window.removeEventListener('storage', handleTradeUpdate);
      delete window.updateDashboardData;
    };
  }, [loadRealData]);

  // Risk status calculation
  const getRiskStatus = () => {
    const { dailyDrawdown, maxDailyDrawdown, accountDrawdown, maxAccountDrawdown } = realDashboardData.riskMetrics || {};
    
    if (dailyDrawdown >= maxDailyDrawdown * 0.8 || accountDrawdown >= maxAccountDrawdown * 0.8) {
      return 'danger';
    }
    if (dailyDrawdown >= maxDailyDrawdown * 0.6 || accountDrawdown >= maxAccountDrawdown * 0.6) {
      return 'warning';
    }
    return 'safe';
  };

  const riskStatus = getRiskStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Trading Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Account Filter */}
            <select 
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              {realDashboardData.accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <TradingButton
              variant="secondary"
              size="sm"
              loading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                  loadRealData();
                }, 1000);
              }}
            >
              <RefreshCw size={16} />
            </TradingButton>
          </div>
        </div>
      </div>

      {/* Risk Alert Banner */}
      {riskStatus !== 'safe' && (
        <div className={`
          mb-6 p-4 rounded-lg border-l-4 
          ${riskStatus === 'danger' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' 
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
          }
        `}>
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <span className="font-medium">
              {riskStatus === 'danger' ? 'CRITICAL: ' : 'WARNING: '}
              Approaching drawdown limits. Trade with caution.
            </span>
          </div>
        </div>
      )}

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's P&L */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {realDashboardData.todayStats.totalPnL > 0 ? '+' : ''}$
              {realDashboardData.todayStats.totalPnL.toLocaleString()}
            </div>
            <div className={`
              p-2 rounded-full
              ${realDashboardData.todayStats.totalPnL > 0 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600'
              }
            `}>
              {realDashboardData.todayStats.totalPnL > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Today's P&L • {realDashboardData.todayStats.totalTrades} trades
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {realDashboardData.todayStats.winRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Streak: {realDashboardData.todayStats.activeStreak}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Win Rate • Today's success rate
          </div>
        </div>

        {/* R-Multiple */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {realDashboardData.todayStats.rMultiple > 0 ? '+' : ''}
              {realDashboardData.todayStats.rMultiple.toFixed(2)}R
            </div>
            <div className={`
              p-2 rounded-full
              ${realDashboardData.todayStats.rMultiple > 1 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
              }
            `}>
              <Target size={20} />
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Avg R-Multiple • Risk-reward ratio
          </div>
        </div>

        {/* Risk Status */}
        <div className={`
          rounded-lg shadow-lg p-6
          ${riskStatus === 'safe' ? 'bg-green-50 dark:bg-green-900/20' : 
            riskStatus === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 
            'bg-red-50 dark:bg-red-900/20'}
        `}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Daily DD:</span>
              <span className="font-medium">
                {realDashboardData.riskMetrics?.dailyDrawdown?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Account DD:</span>
              <span className="font-medium">
                {realDashboardData.riskMetrics?.accountDrawdown?.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Risk Status • Account safety
          </div>
        </div>
      </div>

      {/* Trading Calendar - Full Width */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Trading Calendar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Daily P&L overview
            </p>
          </div>
          <div className="p-6">
            <TradingCalendar />
          </div>
        </div>
      </div>
   
      {/* Account Overview & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Account Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Prop Firm Accounts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account balances and limits
              </p>
            </div>
            <div className="p-6 space-y-4">
              {realDashboardData.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {account.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {account.firm}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ${account.balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Daily Limit: ${account.dailyLimit.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Trades
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Latest executions
              </p>
            </div>
            <div className="p-6 space-y-3">
              {realDashboardData.recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {trade.pair}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {(trade.direction || 'BUY').toUpperCase()} • {trade.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium text-sm ${
                      trade.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple}R
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-4">
        <TradingButton 
          variant="primary" 
          size="lg"
          onClick={() => {
            // Trigger the main App's trade form
            if (window.openTradeForm) {
              window.openTradeForm();
            } else {
              // Fallback: dispatch custom event
              window.dispatchEvent(new CustomEvent('openTradeForm'));
            }
          }}
        >
          <DollarSign size={20} className="mr-2" />
          Add Trade
        </TradingButton>
        
        <TradingButton 
          variant="secondary" 
          size="lg"
          onClick={() => {
            // Navigate to analytics
            if (window.navigateToPage) {
              window.navigateToPage('analytics');
            } else {
              window.dispatchEvent(new CustomEvent('navigateTo', { detail: 'analytics' }));
            }
          }}
        >
          <BarChart3 size={20} className="mr-2" />
          View Analytics
        </TradingButton>
        
        <TradingButton 
          variant="secondary" 
          size="lg"
          onClick={() => {
            if (window.navigateToPage) {
              window.navigateToPage('daily-journal');
            } else {
              window.dispatchEvent(new CustomEvent('navigateTo', { detail: 'daily-journal' }));
            }
          }}
        >
          <Calendar size={20} className="mr-2" />
          Daily Journal
        </TradingButton>
        
        <TradingButton 
          variant="ghost" 
          size="lg"
          onClick={() => {
            if (window.navigateToPage) {
              window.navigateToPage('reports');
            } else {
              window.dispatchEvent(new CustomEvent('navigateTo', { detail: 'reports' }));
            }
          }}
        >
          <PieChart size={20} className="mr-2" />
          Generate Report
        </TradingButton>
      </div>
    </div>
  );
};

export default Dashboard;
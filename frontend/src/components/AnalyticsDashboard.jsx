// 📊 AnalyticsDashboard.jsx - Professional Performance Analytics
// Location: components/AnalyticsDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  DollarSign,
  Percent,
  Activity,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart,Pie,  Cell, AreaChart, Area } from 'recharts';
import TradingCard from './ui/TradingCard';
import TradingButton from './ui/TradingButton';

const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock comprehensive trading data
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalTrades: 127,
      winRate: 68.5,
      totalPnL: 12847.25,
      averageRMultiple: 1.85,
      bestTrade: 2150.75,
      worstTrade: -687.50,
      totalVolume: 45.7,
      sharpeRatio: 1.42,
      maxDrawdown: 8.3,
      profitFactor: 2.14
    },
    
    dailyPnL: [
      { date: '2024-01-01', pnl: 350, cumulative: 350, trades: 3 },
      { date: '2024-01-02', pnl: -125, cumulative: 225, trades: 2 },
      { date: '2024-01-03', pnl: 580, cumulative: 805, trades: 4 },
      { date: '2024-01-04', pnl: 240, cumulative: 1045, trades: 2 },
      { date: '2024-01-05', pnl: -180, cumulative: 865, trades: 3 },
      { date: '2024-01-08', pnl: 720, cumulative: 1585, trades: 5 },
      { date: '2024-01-09', pnl: 145, cumulative: 1730, trades: 2 },
      { date: '2024-01-10', pnl: 425, cumulative: 2155, trades: 3 }
    ],

    winLossDistribution: [
      { name: 'Wins', value: 87, count: 87, color: '#22c55e' },
      { name: 'Losses', value: 40, count: 40, color: '#ef4444' }
    ],

    strategyPerformance: [
      { strategy: 'ICT Concepts', trades: 45, pnl: 6250, winRate: 73.3, avgR: 2.1 },
      { strategy: 'Supply & Demand', trades: 32, pnl: 3850, winRate: 65.6, avgR: 1.8 },
      { strategy: 'Price Action', trades: 28, pnl: 2150, winRate: 60.7, avgR: 1.5 },
      { strategy: 'Breakout', trades: 22, pnl: 597, winRate: 54.5, avgR: 1.2 }
    ],

    timeOfDayPerformance: [
      { hour: '08:00', pnl: 450, trades: 8, winRate: 75 },
      { hour: '09:00', pnl: 680, trades: 12, winRate: 83.3 },
      { hour: '10:00', pnl: 320, trades: 9, winRate: 66.7 },
      { hour: '11:00', pnl: 580, trades: 11, winRate: 72.7 },
      { hour: '12:00', pnl: 240, trades: 6, winRate: 50 },
      { hour: '13:00', pnl: 720, trades: 14, winRate: 78.6 },
      { hour: '14:00', pnl: 380, trades: 10, winRate: 70 },
      { hour: '15:00', pnl: 520, trades: 13, winRate: 76.9 }
    ],

    instrumentPerformance: [
      { pair: 'EURUSD', trades: 28, pnl: 3250, winRate: 71.4, volume: 12.5 },
      { pair: 'GBPJPY', trades: 24, pnl: 2890, winRate: 75.0, volume: 8.7 },
      { pair: 'USDJPY', trades: 22, pnl: 2150, winRate: 68.2, volume: 9.2 },
      { pair: 'GBPUSD', trades: 19, pnl: 1750, winRate: 63.2, volume: 6.8 },
      { pair: 'AUDUSD', trades: 16, pnl: 1320, winRate: 62.5, volume: 5.3 },
      { pair: 'USDCAD', trades: 18, pnl: 1487, winRate: 66.7, volume: 3.2 }
    ],

    rMultipleDistribution: [
      { range: '-3R to -2R', count: 5, color: '#dc2626' },
      { range: '-2R to -1R', count: 12, color: '#ef4444' },
      { range: '-1R to 0R', count: 23, color: '#f97316' },
      { range: '0R to 1R', count: 28, color: '#eab308' },
      { range: '1R to 2R', count: 35, color: '#84cc16' },
      { range: '2R to 3R', count: 18, color: '#22c55e' },
      { range: '3R+', count: 6, color: '#16a34a' }
    ]
  });

  // Calculate additional metrics
  const advancedMetrics = useMemo(() => {
    const { dailyPnL, summary } = analyticsData;
    
    // Calculate consecutive wins/losses
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    dailyPnL.forEach(day => {
      if (day.pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (day.pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Calculate average daily P&L
    const avgDailyPnL = dailyPnL.reduce((sum, day) => sum + day.pnl, 0) / dailyPnL.length;

    // Calculate volatility (standard deviation of daily returns)
    const variance = dailyPnL.reduce((sum, day) => {
      return sum + Math.pow(day.pnl - avgDailyPnL, 2);
    }, 0) / dailyPnL.length;
    const volatility = Math.sqrt(variance);

    return {
      maxWinStreak,
      maxLossStreak,
      avgDailyPnL: parseFloat(avgDailyPnL.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(2))
    };
  }, [analyticsData]);

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('PnL') || entry.name.includes('pnl') ? '$' : ''}{entry.value}
              {entry.name.includes('Rate') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Performance Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive trading performance analysis and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timeframe Filter */}
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            {/* Export Button */}
            <TradingButton variant="secondary" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </TradingButton>

            {/* Refresh Button */}
            <TradingButton
              variant="secondary"
              size="sm"
              loading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 1000);
              }}
            >
              <RefreshCw size={16} />
            </TradingButton>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <TradingCard 
          variant="auto"
          pnl={analyticsData.summary.totalPnL}
          title="Total P&L"
          subtitle={`${analyticsData.summary.totalTrades} trades`}
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${analyticsData.summary.totalPnL.toLocaleString()}
          </div>
        </TradingCard>

        <TradingCard 
          variant="auto"
          winRate={analyticsData.summary.winRate}
          title="Win Rate"
          subtitle="Success percentage"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analyticsData.summary.winRate}%
          </div>
        </TradingCard>

        <TradingCard 
          variant="auto"
          rMultiple={analyticsData.summary.averageRMultiple}
          title="Avg R-Multiple"
          subtitle="Risk-reward efficiency"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analyticsData.summary.averageRMultiple}R
          </div>
        </TradingCard>

        <TradingCard 
          variant="performance"
          title="Profit Factor"
          subtitle="Gross profit vs loss"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analyticsData.summary.profitFactor}
          </div>
        </TradingCard>

        <TradingCard 
          variant="info"
          title="Max Drawdown"
          subtitle="Peak-to-trough loss"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analyticsData.summary.maxDrawdown}%
          </div>
        </TradingCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* P&L Curve */}
        <TradingCard title="P&L Curve" subtitle="Daily performance and cumulative growth">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.dailyPnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.1}
                strokeWidth={2}
                name="Cumulative P&L"
              />
              <Bar dataKey="pnl" fill="#3b82f6" opacity={0.7} name="Daily P&L" />
            </AreaChart>
          </ResponsiveContainer>
        </TradingCard>

        {/* Win/Loss Distribution */}
        <TradingCard title="Win/Loss Distribution" subtitle="Trade outcome breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={analyticsData.winLossDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
              >
                {analyticsData.winLossDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </TradingCard>

        {/* Time of Day Performance */}
        <TradingCard title="Time of Day Performance" subtitle="Hourly trading efficiency">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.timeOfDayPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" fill="#8b5cf6" name="P&L" />
              <Line 
                type="monotone" 
                dataKey="winRate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Win Rate %"
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        </TradingCard>

        {/* R-Multiple Distribution */}
        <TradingCard title="R-Multiple Distribution" subtitle="Risk-reward outcome frequency">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.rMultipleDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis type="category" dataKey="range" stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#06b6d4" name="Trade Count" />
            </BarChart>
          </ResponsiveContainer>
        </TradingCard>
      </div>

      {/* Detailed Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Strategy Performance */}
        <TradingCard title="Strategy Performance" subtitle="Performance breakdown by trading strategy">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium">Strategy</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Trades</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">P&L</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Win Rate</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Avg R</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.strategyPerformance.map((strategy, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                      {strategy.strategy}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {strategy.trades}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      strategy.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${strategy.pnl.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-gray-100">
                      {strategy.winRate}%
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      strategy.avgR > 1 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {strategy.avgR}R
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TradingCard>

        {/* Instrument Performance */}
        <TradingCard title="Instrument Performance" subtitle="Performance breakdown by currency pairs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium">Pair</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Trades</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">P&L</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Win Rate</th>
                  <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.instrumentPerformance.map((instrument, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                      {instrument.pair}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {instrument.trades}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      instrument.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${instrument.pnl.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-gray-100">
                      {instrument.winRate}%
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {instrument.volume}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TradingCard>
      </div>

      {/* Advanced Metrics Summary */}
      <div className="mt-8">
        <TradingCard title="Advanced Performance Metrics" subtitle="Deep statistical analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {advancedMetrics.maxWinStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Max Win Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {advancedMetrics.maxLossStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Max Loss Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${advancedMetrics.avgDailyPnL}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Daily P&L</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analyticsData.summary.sharpeRatio}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</div>
            </div>
          </div>
        </TradingCard>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
// 📈 TradeChart.jsx - Advanced Trading Chart Visualization
// Location: components/TradeChart.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Maximize2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import TradingCard from './ui/TradingCard';
import TradingButton from './ui/TradingButton';

const TradeChart = ({ 
  trades = [], 
  selectedAccount = 'all',
  selectedTimeframe = '1D',
  showVolume = true,
  showMA = false,
  title = "Trading Performance Chart"
}) => {
  const [chartType, setChartType] = useState('pnl-curve');
  const [dateRange, setDateRange] = useState('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [indicators, setIndicators] = useState({
    movingAverage: false,
    trendLine: false,
    support: false,
    resistance: false
  });

  // Mock trade data for demonstration
  const mockTrades = [
    { id: 1, date: '2024-01-01', pnl: 250, cumulative: 250, volume: 2.5, rMultiple: 1.2, pair: 'EURUSD', direction: 'long' },
    { id: 2, date: '2024-01-02', pnl: -125, cumulative: 125, volume: 1.8, rMultiple: -0.6, pair: 'GBPJPY', direction: 'short' },
    { id: 3, date: '2024-01-03', pnl: 380, cumulative: 505, volume: 3.2, rMultiple: 1.8, pair: 'USDJPY', direction: 'long' },
    { id: 4, date: '2024-01-04', pnl: 150, cumulative: 655, volume: 2.1, rMultiple: 0.9, pair: 'GBPUSD', direction: 'long' },
    { id: 5, date: '2024-01-05', pnl: -200, cumulative: 455, volume: 2.8, rMultiple: -1.1, pair: 'AUDUSD', direction: 'short' },
    { id: 6, date: '2024-01-08', pnl: 420, cumulative: 875, volume: 3.5, rMultiple: 2.1, pair: 'EURUSD', direction: 'long' },
    { id: 7, date: '2024-01-09', pnl: 75, cumulative: 950, volume: 1.5, rMultiple: 0.4, pair: 'USDCAD', direction: 'short' },
    { id: 8, date: '2024-01-10', pnl: 320, cumulative: 1270, volume: 2.9, rMultiple: 1.6, pair: 'GBPJPY', direction: 'long' },
    { id: 9, date: '2024-01-11', pnl: -180, cumulative: 1090, volume: 2.2, rMultiple: -0.8, pair: 'USDJPY', direction: 'short' },
    { id: 10, date: '2024-01-12', pnl: 450, cumulative: 1540, volume: 4.1, rMultiple: 2.3, pair: 'EURUSD', direction: 'long' },
    { id: 11, date: '2024-01-15', pnl: 280, cumulative: 1820, volume: 2.6, rMultiple: 1.4, pair: 'GBPUSD', direction: 'long' },
    { id: 12, date: '2024-01-16', pnl: -95, cumulative: 1725, volume: 1.9, rMultiple: -0.5, pair: 'AUDUSD', direction: 'short' },
    { id: 13, date: '2024-01-17', pnl: 350, cumulative: 2075, volume: 3.8, rMultiple: 1.9, pair: 'GBPJPY', direction: 'long' },
    { id: 14, date: '2024-01-18', pnl: 125, cumulative: 2200, volume: 2.3, rMultiple: 0.7, pair: 'USDCAD', direction: 'short' },
    { id: 15, date: '2024-01-19', pnl: 275, cumulative: 2475, volume: 3.1, rMultiple: 1.5, pair: 'EURUSD', direction: 'long' }
  ];

  const chartData = trades.length > 0 ? trades : mockTrades;

  // Process data based on chart type
  const processedData = useMemo(() => {
    switch (chartType) {
      case 'pnl-curve':
        return chartData.map(trade => ({
          ...trade,
          date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          profitColor: trade.pnl > 0 ? '#22c55e' : '#ef4444'
        }));

      case 'win-loss':
        const winLossData = chartData.reduce((acc, trade) => {
          const month = new Date(trade.date).toLocaleDateString('en-US', { month: 'short' });
          if (!acc[month]) {
            acc[month] = { month, wins: 0, losses: 0, total: 0 };
          }
          if (trade.pnl > 0) {
            acc[month].wins++;
          } else {
            acc[month].losses++;
          }
          acc[month].total++;
          return acc;
        }, {});
        return Object.values(winLossData);

      case 'r-multiple':
        return chartData.map(trade => ({
          ...trade,
          date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rColor: trade.rMultiple > 0 ? '#22c55e' : '#ef4444'
        }));

      case 'volume':
        return chartData.map(trade => ({
          ...trade,
          date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volumeColor: '#3b82f6'
        }));

      case 'pair-performance':
        const pairData = chartData.reduce((acc, trade) => {
          if (!acc[trade.pair]) {
            acc[trade.pair] = { pair: trade.pair, totalPnL: 0, trades: 0, winRate: 0 };
          }
          acc[trade.pair].totalPnL += trade.pnl;
          acc[trade.pair].trades++;
          if (trade.pnl > 0) acc[trade.pair].winRate++;
          return acc;
        }, {});
        
        return Object.values(pairData).map(pair => ({
          ...pair,
          winRate: (pair.winRate / pair.trades) * 100,
          pnlColor: pair.totalPnL > 0 ? '#22c55e' : '#ef4444'
        }));

      default:
        return chartData;
    }
  }, [chartData, chartType]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}: 
              </span>
              <span className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name.includes('P&L') || entry.name.includes('pnl') ? '$' : ''}
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                {entry.name.includes('Rate') ? '%' : ''}
                {entry.name.includes('R') && !entry.name.includes('Rate') ? 'R' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart type configurations
  const chartConfigs = {
    'pnl-curve': {
      title: 'P&L Curve',
      description: 'Cumulative profit and loss over time',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="cumulative" 
              stroke="#22c55e" 
              fill="#22c55e" 
              fillOpacity={0.2}
              strokeWidth={3}
              name="Cumulative P&L"
            />
            <Bar 
              dataKey="pnl" 
              fill="#3b82f6" 
              opacity={0.7}
              name="Daily P&L"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )
    },

    'win-loss': {
      title: 'Win/Loss Analysis',
      description: 'Monthly win and loss distribution',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="wins" 
              stackId="1"
              stroke="#22c55e" 
              fill="#22c55e" 
              name="Wins"
            />
            <Area 
              type="monotone" 
              dataKey="losses" 
              stackId="1"
              stroke="#ef4444" 
              fill="#ef4444" 
              name="Losses"
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    },

    'r-multiple': {
      title: 'R-Multiple Distribution',
      description: 'Risk-reward ratios over time',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter 
              dataKey="rMultiple" 
              fill="#8b5cf6"
              name="R-Multiple"
            />
            <Line 
              type="monotone" 
              dataKey="rMultiple" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              name="R-Trend"
            />
          </ScatterChart>
        </ResponsiveContainer>
      )
    },

    'volume': {
      title: 'Trading Volume',
      description: 'Position sizes over time',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#06b6d4" 
              fill="#06b6d4" 
              fillOpacity={0.6}
              name="Volume"
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    },

    'pair-performance': {
      title: 'Pair Performance',
      description: 'Performance breakdown by currency pairs',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={processedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="pair" 
              stroke="#6b7280" 
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="totalPnL" 
              fill="#3b82f6"
              name="Total P&L"
            />
            <Line 
              type="monotone" 
              dataKey="winRate" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="Win Rate %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }
  };

  const currentConfig = chartConfigs[chartType];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 bg-white dark:bg-gray-950 z-50 p-6' : ''}`}>
      <TradingCard 
        title={currentConfig.title}
        subtitle={currentConfig.description}
        className={isFullscreen ? 'h-full' : ''}
      >
        
        {/* Chart Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="pnl-curve">P&L Curve</option>
              <option value="win-loss">Win/Loss Analysis</option>
              <option value="r-multiple">R-Multiple</option>
              <option value="volume">Trading Volume</option>
              <option value="pair-performance">Pair Performance</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          {/* Chart Actions */}
          <div className="flex items-center space-x-2">
            <TradingButton
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} />
            </TradingButton>

            <TradingButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 size={16} />
            </TradingButton>

            <TradingButton
              variant="ghost"
              size="sm"
            >
              <Download size={16} />
            </TradingButton>

            <TradingButton
              variant="ghost"
              size="sm"
            >
              <RefreshCw size={16} />
            </TradingButton>
          </div>
        </div>

        {/* Chart Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Chart Settings
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(indicators).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setIndicators(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Chart Container */}
        <div className={`${isFullscreen ? 'flex-1' : ''}`}>
          {currentConfig.component}
        </div>

        {/* Chart Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {processedData.filter(d => d.pnl > 0).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Winning Trades</div>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {processedData.filter(d => d.pnl <= 0).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Losing Trades</div>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {((processedData.filter(d => d.pnl > 0).length / processedData.length) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {(processedData.reduce((sum, d) => sum + (d.rMultiple || 0), 0) / processedData.length).toFixed(2)}R
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg R-Multiple</div>
          </div>
        </div>

        {/* Close Fullscreen Button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ✕
          </button>
        )}
      </TradingCard>
    </div>
  );
};

export default TradeChart;
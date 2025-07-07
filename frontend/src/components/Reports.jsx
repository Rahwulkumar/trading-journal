import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Filter,
  Calendar,
  TrendingUp, 
  TrendingDown, 
  Target,
  SortAsc,
  SortDesc,
  Eye,
  X,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  FileText,
  DollarSign,
  Activity,
  Award,
  AlertTriangle
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';
import GlassInput from './ui/GlassInput';
import { theme } from '../theme/theme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    account: 'all',
    instrument: 'all',
    strategy: 'all',
    direction: 'all',
    minPnL: '',
    maxPnL: '',
    minRMultiple: '',
    maxRMultiple: '',
    emotion: 'all',
    quickFilter: 'all'
  });

  const [sortConfig, setSortConfig] = useState({
    field: 'date',
    direction: 'desc'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(20);
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/trades/');
      if (response.ok) {
        const trades = await response.json();
        const processedTrades = trades.map(trade => ({
          ...trade,
          pnl: calculatePnL(trade),
          rMultiple: trade.risk_amount ? calculatePnL(trade) / trade.risk_amount : 0
        }));
        setAllTrades(processedTrades);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePnL = (trade) => {
    const direction = trade.direction.toLowerCase();
    const entryPrice = parseFloat(trade.entry_price);
    const exitPrice = parseFloat(trade.exit_price);
    const size = parseFloat(trade.size);
    const fees = parseFloat(trade.fees) || 0;

    if (direction === 'long') {
      return ((exitPrice - entryPrice) * size) - fees;
    } else {
      return ((entryPrice - exitPrice) * size) - fees;
    }
  };

  const uniqueAccounts = [...new Set(allTrades.map(trade => trade.account))];
  const uniqueInstruments = [...new Set(allTrades.map(trade => trade.instrument))];
  const uniqueStrategies = [...new Set(allTrades.map(trade => trade.strategy_tag).filter(Boolean))];
  const uniqueEmotions = [...new Set(allTrades.map(trade => trade.pre_emotion).filter(Boolean))];

  const filteredTrades = useMemo(() => {
    let trades = allTrades.filter(trade => {
      if (filters.quickFilter === 'winning' && trade.pnl <= 0) return false;
      if (filters.quickFilter === 'losing' && trade.pnl >= 0) return false;
      if (filters.quickFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (trade.date !== today) return false;
      }
      if (filters.quickFilter === 'thisWeek') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        if (new Date(trade.date) < startOfWeek) return false;
      }
      
      if (filters.dateFrom && trade.date < filters.dateFrom) return false;
      if (filters.dateTo && trade.date > filters.dateTo) return false;
      
      if (filters.account !== 'all' && trade.account !== filters.account) return false;
      if (filters.instrument !== 'all' && trade.instrument !== filters.instrument) return false;
      if (filters.strategy !== 'all' && trade.strategy_tag !== filters.strategy) return false;
      if (filters.direction !== 'all' && trade.direction !== filters.direction) return false;
      if (filters.emotion !== 'all' && trade.pre_emotion !== filters.emotion) return false;
      
      if (filters.minPnL && trade.pnl < parseFloat(filters.minPnL)) return false;
      if (filters.maxPnL && trade.pnl > parseFloat(filters.maxPnL)) return false;
      if (filters.minRMultiple && trade.rMultiple < parseFloat(filters.minRMultiple)) return false;
      if (filters.maxRMultiple && trade.rMultiple > parseFloat(filters.maxRMultiple)) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          trade.instrument,
          trade.strategy_tag,
          trade.rationale,
          trade.tags,
          trade.pre_emotion,
          trade.post_reflection,
          trade.trade_type,
          trade.timeframe
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchLower)) return false;
      }
      
      return true;
    });

    trades.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];
      
      if (['pnl', 'rMultiple', 'entry_price', 'exit_price', 'size', 'fees'].includes(sortConfig.field)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return trades;
  }, [allTrades, filters, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + tradesPerPage);

  const summaryStats = useMemo(() => {
    const trades = filteredTrades;
    
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageRMultiple: 0,
        bestTrade: 0,
        worstTrade: 0,
        profitFactor: 0
      };
    }

    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl <= 0);
    const winRate = (winningTrades.length / totalTrades) * 100;
    const averageRMultiple = trades.reduce((sum, trade) => sum + trade.rMultiple, 0) / totalTrades;
    const bestTrade = Math.max(...trades.map(trade => trade.pnl));
    const worstTrade = Math.min(...trades.map(trade => trade.pnl));
    
    const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    return {
      totalTrades,
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(2)),
      averageRMultiple: parseFloat(averageRMultiple.toFixed(2)),
      bestTrade: parseFloat(bestTrade.toFixed(2)),
      worstTrade: parseFloat(worstTrade.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2))
    };
  }, [filteredTrades]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      dateFrom: '', dateTo: '', account: 'all', instrument: 'all',
      strategy: 'all', direction: 'all', minPnL: '', maxPnL: '',
      minRMultiple: '', maxRMultiple: '', emotion: 'all', quickFilter: 'all'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Instrument', 'Direction', 'Entry', 'Exit', 'Size', 'P&L', 'R-Multiple', 'Strategy'];
    const rows = filteredTrades.map(trade => [
      trade.date,
      trade.instrument,
      trade.direction,
      trade.entry_price,
      trade.exit_price,
      trade.size,
      trade.pnl.toFixed(2),
      trade.rMultiple.toFixed(2),
      trade.strategy_tag || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <div className="bg-gray-900 p-3 rounded-lg border border-white/10">
        <p className="text-white text-sm">
          {payload[0].name}: ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
              Trade Reports
            </h1>
            <p className="text-white/60">
              Explore, filter, and analyze all your trading data
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <NeonButton
              variant="glass"
              onClick={exportToCSV}
              icon={Download}
            >
              Export CSV
            </NeonButton>
            
            <NeonButton
              variant="glass"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </NeonButton>
            
            <NeonButton
              variant="glass"
              onClick={loadTrades}
              loading={isLoading}
              icon={RefreshCw}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All Trades', icon: BarChart3, count: allTrades.length },
              { key: 'winning', label: 'Winners', icon: TrendingUp, count: allTrades.filter(t => t.pnl > 0).length, variant: 'profit' },
              { key: 'losing', label: 'Losers', icon: TrendingDown, count: allTrades.filter(t => t.pnl < 0).length, variant: 'loss' },
              { key: 'today', label: 'Today', icon: Calendar, count: allTrades.filter(t => t.date === new Date().toISOString().split('T')[0]).length },
              { key: 'thisWeek', label: 'This Week', icon: Calendar, count: (() => {
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
                return allTrades.filter(t => new Date(t.date) >= startOfWeek).length;
              })() }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, quickFilter: tab.key }));
                    setCurrentPage(1);
                  }}
                  className={`
                    group relative px-4 py-3 rounded-xl transition-all duration-300
                    ${filters.quickFilter === tab.key 
                      ? tab.variant === 'profit' 
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-400'
                        : tab.variant === 'loss'
                        ? 'bg-red-500/20 text-red-400 border-2 border-red-400'
                        : 'bg-white/10 text-white border-2 border-white/30'
                      : 'bg-white/5 text-white/60 border-2 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={18} />
                    <div className="text-left">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.count} trades</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showFilters && (
          <GlassCard title="Advanced Filters" icon={Filter}>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search by instrument, strategy, notes, or emotion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-white/40 hover:text-white/60"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassInput
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />

                <GlassInput
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Account</label>
                  <select
                    value={filters.account}
                    onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
                    className="w-full h-12 px-4 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30"
                  >
                    <option value="all">All Instruments</option>
                    {uniqueInstruments.map(instrument => (
                      <option key={instrument} value={instrument}>{instrument}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Strategy</label>
                  <select
                    value={filters.strategy}
                    onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                    className="w-full h-12 px-4 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30"
                  >
                    <option value="all">All Strategies</option>
                    {uniqueStrategies.map(strategy => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Direction</label>
                  <select
                    value={filters.direction}
                    onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                    className="w-full h-12 px-4 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30"
                  >
                    <option value="all">All Directions</option>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>

                <GlassInput
                  label="Min P&L"
                  type="number"
                  placeholder="Min P&L"
                  value={filters.minPnL}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPnL: e.target.value }))}
                  prefix="$"
                />

                <GlassInput
                  label="Max P&L"
                  type="number"
                  placeholder="Max P&L"
                  value={filters.maxPnL}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPnL: e.target.value }))}
                  prefix="$"
                />
              </div>

              <div className="flex justify-end">
                <NeonButton
                  variant="ghost"
                  onClick={clearAllFilters}
                  icon={RefreshCw}
                >
                  Clear All Filters
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard variant="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Filtered Results</span>
                <FileText size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {summaryStats.totalTrades}
              </div>
              <div className="text-sm text-white/60 mt-1">
                {summaryStats.winningTrades} wins, {summaryStats.losingTrades} losses
              </div>
            </div>
          </GlassCard>

          <GlassCard
            variant="medium"
            neon={summaryStats.totalPnL > 0 ? 'profit' : summaryStats.totalPnL < 0 ? 'loss' : null}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Total P&L</span>
                <DollarSign size={20} className="text-white/40" />
              </div>
              <div className={`text-3xl font-bold ${
                summaryStats.totalPnL > 0 ? 'text-green-400' : 
                summaryStats.totalPnL < 0 ? 'text-red-400' : 
                'text-white'
              }`}>
                {summaryStats.totalPnL > 0 ? '+' : ''}$
                {summaryStats.totalPnL.toLocaleString()}
              </div>
              <div className="text-sm text-white/60 mt-1">
                From filtered trades
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Win Rate</span>
                <Target size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {summaryStats.winRate}%
              </div>
              <div className="mt-2">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${summaryStats.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Profit Factor</span>
                <Award size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {summaryStats.profitFactor}
              </div>
              <div className={`text-sm mt-1 ${
                summaryStats.profitFactor >= 2 ? 'text-green-400' :
                summaryStats.profitFactor >= 1.5 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {summaryStats.profitFactor >= 2 ? 'Excellent' :
                 summaryStats.profitFactor >= 1.5 ? 'Good' :
                 summaryStats.profitFactor >= 1 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard title={`Trade Details (${filteredTrades.length} trades)`} icon={BarChart3}>
          <div className="p-6">
            {filteredTrades.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {[
                          { key: 'date', label: 'Date' },
                          { key: 'instrument', label: 'Instrument' },
                          { key: 'direction', label: 'Direction' },
                          { key: 'entry_price', label: 'Entry' },
                          { key: 'exit_price', label: 'Exit' },
                          { key: 'size', label: 'Size' },
                          { key: 'pnl', label: 'P&L' },
                          { key: 'rMultiple', label: 'R-Multiple' },
                          { key: 'strategy_tag', label: 'Strategy' },
                          { key: 'actions', label: 'Actions' }
                        ].map(column => (
                          <th
                            key={column.key}
                            className={`text-left py-3 px-2 text-white/60 font-medium ${
                              column.key !== 'actions' ? 'cursor-pointer hover:text-white' : ''
                            }`}
                            onClick={column.key !== 'actions' ? () => handleSort(column.key) : undefined}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{column.label}</span>
                              {column.key !== 'actions' && sortConfig.field === column.key && (
                                sortConfig.direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-2 text-white/80">
                            {new Date(trade.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 font-medium text-white">
                            {trade.instrument}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              trade.direction === 'long' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.direction === 'long' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                              {trade.direction.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-white/60">
                            {trade.entry_price}
                          </td>
                          <td className="py-3 px-2 text-white/60">
                            {trade.exit_price}
                          </td>
                          <td className="py-3 px-2 text-white/60">
                            {trade.size}
                          </td>
                          <td className={`py-3 px-2 font-medium ${
                            trade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                          <td className={`py-3 px-2 font-medium ${
                            trade.rMultiple > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                          </td>
                          <td className="py-3 px-2 text-white/60">
                            {trade.strategy_tag || '-'}
                          </td>
                          <td className="py-3 px-2">
                            <NeonButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTrade(trade)}
                              icon={Eye}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-sm text-white/60">
                      Showing {startIndex + 1} to {Math.min(startIndex + tradesPerPage, filteredTrades.length)} of {filteredTrades.length} trades
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <NeonButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        icon={ChevronLeft}
                      />
                      
                      <span className="text-sm text-white/60">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <NeonButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        icon={ChevronRight}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/60">No trades found for the selected filters</p>
                <p className="text-sm text-white/40 mt-1">
                  Try adjusting your filters or date range
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {selectedTrade && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10">
              
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Trade Details - {selectedTrade.instrument}
                    </h2>
                    <p className="text-white/60 mt-1">
                      {new Date(selectedTrade.date).toLocaleDateString()} • {selectedTrade.direction.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="text-white/40 hover:text-white/60"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlassCard 
                    variant="medium" 
                    neon={selectedTrade.pnl > 0 ? 'profit' : 'loss'}
                  >
                    <div className="p-6">
                      <div className="text-sm text-white/60 mb-1">P&L</div>
                      <div className={`text-2xl font-bold ${
                        selectedTrade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedTrade.pnl > 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard variant="medium">
                    <div className="p-6">
                      <div className="text-sm text-white/60 mb-1">R-Multiple</div>
                      <div className={`text-2xl font-bold ${
                        selectedTrade.rMultiple > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedTrade.rMultiple > 0 ? '+' : ''}{selectedTrade.rMultiple.toFixed(2)}R
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard variant="medium">
                    <div className="p-6">
                      <div className="text-sm text-white/60 mb-1">Position Size</div>
                      <div className="text-2xl font-bold text-white">
                        {selectedTrade.size}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Trade Information</h3>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Account', value: selectedTrade.account },
                        { label: 'Strategy', value: selectedTrade.strategy_tag || 'N/A' },
                        { label: 'Entry Price', value: selectedTrade.entry_price },
                        { label: 'Exit Price', value: selectedTrade.exit_price },
                        { label: 'Stop Loss', value: selectedTrade.stop_loss || 'N/A', color: 'text-red-400' },
                        { label: 'Take Profit', value: selectedTrade.take_profit || 'N/A', color: 'text-green-400' },
                        { label: 'Fees', value: `${selectedTrade.fees || 0}` }
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center">
                          <span className="text-white/60">{item.label}:</span>
                          <span className={`font-medium ${item.color || 'text-white'}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Psychology & Analysis</h3>
                    
                    {selectedTrade.pre_emotion && (
                      <div>
                        <span className="text-sm font-medium text-white/60">Pre-Trade Emotion:</span>
                        <p className="mt-1 text-white capitalize">{selectedTrade.pre_emotion}</p>
                      </div>
                    )}
                    
                    {selectedTrade.rationale && (
                      <div>
                        <span className="text-sm font-medium text-white/60">Trade Rationale:</span>
                        <p className="mt-1 text-white">{selectedTrade.rationale}</p>
                      </div>
                    )}
                    
                    {selectedTrade.post_reflection && (
                      <div>
                        <span className="text-sm font-medium text-white/60">Post-Trade Reflection:</span>
                        <p className="mt-1 text-white">{selectedTrade.post_reflection}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTrade.screenshots && selectedTrade.screenshots.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Screenshots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedTrade.screenshots.map((screenshot, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={screenshot.screenshot_url}
                            alt={screenshot.label || `Screenshot ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-white/10"
                          />
                          {screenshot.label && (
                            <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                              {screenshot.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10">
                <div className="flex justify-end">
                  <NeonButton
                    variant="ghost"
                    onClick={() => setSelectedTrade(null)}
                  >
                    Close
                  </NeonButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
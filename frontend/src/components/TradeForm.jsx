import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Clock,
  Brain,
  ChevronDown,
  RefreshCw,
  BarChart,
  Eye,
  X,
  Plus,
  Trash2,
  Shield,
  Zap,
  Activity
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';
import TradingInput from './ui/TradingInput';
import { theme } from '../theme/theme';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TradeForm = ({ isOpen, onClose, onSubmit, editingTrade = null }) => {
  const [trade, setTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    entry_datetime: '',
    exit_datetime: '',
    instrument: '',
    direction: 'long',
    entry_price: '',
    exit_price: '',
    size: '',
    fees: '0',
    account: '',
    stop_loss: '',
    take_profit: '',
    trade_type: '',
    rationale: '',
    tags: '',
    pre_emotion: '',
    post_reflection: '',
    risk_amount: '',
    strategy_tag: '',
    rules_followed: [],
    timeframe_analysis: [],
    isLiveTrade: false,
    isClosed: false,
  });

  const [calculations, setCalculations] = useState({
    pnl: 0,
    rMultiple: 0,
    riskPercent: 0,
    rewardRiskRatio: 0,
    positionSize: 0
  });

  const [validation, setValidation] = useState({
    errors: {},
    warnings: [],
    riskStatus: 'safe'
  });

  const [screenshots, setScreenshots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [showChart, setShowChart] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceTimestamp, setPriceTimestamp] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [strategies, setStrategies] = useState([]);

  const weeklyBiasOptions = {
    EUR: ['Bullish on EUR', 'Watch ECB news', 'Monitor EURUSD support'],
    USD: ['Dovish Fed outlook', 'NFP week', 'USD Index at resistance'],
    GBP: ['Brexit headlines', 'BOE meeting', 'GBPUSD trend'],
    JPY: ['BOJ intervention risk', 'Yen safe haven flows'],
  };

  const strategyChecklists = {
    'ICT Concepts': [
      'Check market structure',
      'Identify order blocks',
      'Confirm liquidity sweep',
      'Set FVG targets'
    ],
    'Supply & Demand': [
      'Mark supply zones',
      'Mark demand zones',
      'Wait for confirmation candle',
      'Check higher timeframe alignment'
    ],
    'Price Action': [
      'Identify key S/R levels',
      'Look for price action signals',
      'Check for fakeouts'
    ],
    'Breakout': [
      'Draw breakout levels',
      'Wait for retest',
      'Confirm with volume'
    ],
  };

  const emotionTags = [
    'Confident', 'Nervous', 'Excited', 'Calm', 'Anxious', 'Focused', 'Impatient', 'Disciplined'
  ];

  const timeframes = [
    { key: '5m', label: '5 Minutes', value: '5min' },
    { key: '15m', label: '15 Minutes', value: '15min' },
    { key: '1h', label: '1 Hour', value: '1H' },
    { key: '4h', label: '4 Hours', value: '4H' }
  ];

  const [weeklyBiasChecklist, setWeeklyBiasChecklist] = useState({});
  const [strategyChecklist, setStrategyChecklist] = useState({});
  const [timeframeInput, setTimeframeInput] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    calculateMetrics();
  }, [trade.entry_price, trade.exit_price, trade.size, trade.direction, trade.risk_amount, trade.account]);

  useEffect(() => {
    validatePropFirmRules();
  }, [trade, calculations]);

  useEffect(() => {
    const instrument = trade.instrument;
    if (instrument && instrument.length >= 3) {
      const currency = instrument.slice(0, 3).toUpperCase();
      const options = weeklyBiasOptions[currency] || [];
      setWeeklyBiasChecklist(
        options.reduce((acc, item) => ({ ...acc, [item]: false }), {})
      );
    } else {
      setWeeklyBiasChecklist({});
    }
  }, [trade.instrument]);

  useEffect(() => {
    const strategy = trade.strategy_tag;
    const options = strategyChecklists[strategy] || [];
    setStrategyChecklist(
      options.reduce((acc, item) => ({ ...acc, [item]: false }), {})
    );
  }, [trade.strategy_tag]);

  const fetchInitialData = async () => {
    try {
      const [accountsResponse, strategiesResponse] = await Promise.all([
        fetch('http://localhost:8000/accounts/'),
        fetch('http://localhost:8000/strategies/')
      ]);

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);
      }

      if (strategiesResponse.ok) {
        const strategiesData = await strategiesResponse.json();
        setStrategies(strategiesData);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchCurrentPrice = async (instrument) => {
    if (!instrument) return;
    
    setCurrentPrice(null);
    setPriceTimestamp(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/live-price/${instrument}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentPrice(data.data.mid);
        setPriceTimestamp(new Date().toLocaleTimeString());
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.log('Using mock data (markets closed or API not configured)');
      
      const mockPrices = {
        'EURUSD': 1.0875,
        'GBPUSD': 1.2650,
        'USDJPY': 148.25,
        'GBPJPY': 187.45,
        'AUDUSD': 0.6750,
        'USDCAD': 1.3650
      };
      
      const mockPrice = mockPrices[instrument.toUpperCase()] || 1.0000;
      setCurrentPrice(mockPrice);
      setPriceTimestamp(new Date().toLocaleTimeString() + ' (Mock)');
    }
  };

  const calculateMetrics = useCallback(() => {
    const { entry_price, exit_price, size, direction, risk_amount, account } = trade;
    
    if (!entry_price || !exit_price || !size) {
      setCalculations({ pnl: 0, rMultiple: 0, riskPercent: 0, rewardRiskRatio: 0, positionSize: 0 });
      return;
    }

    const entryPrice = parseFloat(entry_price);
    const exitPrice = parseFloat(exit_price);
    const tradeSize = parseFloat(size);
    const riskAmount = parseFloat(risk_amount) || 0;

    let pnl = 0;
    if (direction === 'long') {
      pnl = (exitPrice - entryPrice) * tradeSize;
    } else {
      pnl = (entryPrice - exitPrice) * tradeSize;
    }

    const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;

    const selectedAccount = accounts.find(acc => acc.account_name === account);
    const riskPercent = selectedAccount && riskAmount > 0 
      ? (riskAmount / selectedAccount.capital_size) * 100 
      : 0;

    const rewardRiskRatio = riskAmount > 0 ? Math.abs(pnl) / riskAmount : 0;

    setCalculations({
      pnl: parseFloat(pnl.toFixed(2)),
      rMultiple: parseFloat(rMultiple.toFixed(2)),
      riskPercent: parseFloat(riskPercent.toFixed(2)),
      rewardRiskRatio: parseFloat(rewardRiskRatio.toFixed(2)),
      positionSize: tradeSize
    });
  }, [trade, accounts]);

  const validatePropFirmRules = useCallback(() => {
    const errors = {};
    const warnings = [];
    let riskStatus = 'safe';

    const selectedAccount = accounts.find(acc => acc.account_name === trade.account);
    
    if (selectedAccount && calculations.riskPercent > 0) {
      if (calculations.riskPercent > 2) {
        errors.risk = 'Risk exceeds 2% of account balance - violates prop firm rules';
        riskStatus = 'danger';
      } else if (calculations.riskPercent > 1.5) {
        warnings.push('Risk approaching 2% limit - consider reducing position size');
        riskStatus = 'warning';
      }

      const dailyRisk = parseFloat(trade.risk_amount) || 0;
      if (dailyRisk > selectedAccount.capital_size * (selectedAccount.max_daily_drawdown / 100) * 0.8) {
        warnings.push('Approaching daily loss limit');
        riskStatus = 'warning';
      }
    }

    if (calculations.rMultiple < -3) {
      warnings.push('R-Multiple below -3R - consider stricter stop loss');
    }

    if (trade.entry_datetime && trade.exit_datetime) {
      const entryTime = new Date(trade.entry_datetime);
      const exitTime = new Date(trade.exit_datetime);
      
      if (exitTime <= entryTime) {
        errors.timing = 'Exit time must be after entry time';
      }
    }

    setValidation({ errors, warnings, riskStatus });
  }, [trade, calculations, accounts]);

  const calculateOptimalPosition = () => {
    const { entry_price, stop_loss, account } = trade;
    
    if (!entry_price || !stop_loss || !account) return;

    const selectedAccount = accounts.find(acc => acc.account_name === account);
    if (!selectedAccount) return;

    const entryPrice = parseFloat(entry_price);
    const stopLoss = parseFloat(stop_loss);
    const riskAmount = selectedAccount.capital_size * 0.01;
    
    const priceDistance = Math.abs(entryPrice - stopLoss);
    const optimalSize = riskAmount / priceDistance;

    setTrade(prev => ({
      ...prev,
      size: optimalSize.toFixed(2),
      risk_amount: riskAmount.toFixed(2)
    }));
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingScreenshots(true);

    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
        
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`);
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'TradeSync Screenshots');
        
        const response = await fetch('http://localhost:8000/api/upload-screenshot', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        return {
          file,
          preview: URL.createObjectURL(file),
          url: result.url,
          label: '',
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          size: file.size
        };
      });

      const uploadedScreenshots = await Promise.all(uploadPromises);
      setScreenshots(prev => [...prev, ...uploadedScreenshots]);
      
    } catch (error) {
      console.error('Error uploading screenshots:', error);
      alert(`Error uploading screenshots: ${error.message}`);
    } finally {
      setUploadingScreenshots(false);
    }
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => {
      const newScreenshots = [...prev];
      if (newScreenshots[index].preview.startsWith('blob:')) {
        URL.revokeObjectURL(newScreenshots[index].preview);
      }
      newScreenshots.splice(index, 1);
      return newScreenshots;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(validation.errors).length > 0) {
      alert('Please fix the validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const tradeData = {
        ...trade,
        weeklyBiasChecklist,
        strategyChecklist,
        screenshots: screenshots.map(s => ({
          url: s.url,
          label: s.label || 'Trade Screenshot',
          uploadedAt: s.uploadedAt,
          originalName: s.originalName,
          size: s.size
        })),
        pnl: calculations.pnl,
        r_multiple: calculations.rMultiple,
        risk_percent: calculations.riskPercent,
      };

      await onSubmit(tradeData);
      
      if (!editingTrade) {
        resetForm();
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Error submitting trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTrade({
      date: new Date().toISOString().split('T')[0],
      entry_datetime: '',
      exit_datetime: '',
      instrument: '',
      direction: 'long',
      entry_price: '',
      exit_price: '',
      size: '',
      fees: '0',
      account: '',
      stop_loss: '',
      take_profit: '',
      trade_type: '',
      rationale: '',
      tags: '',
      pre_emotion: '',
      post_reflection: '',
      risk_amount: '',
      strategy_tag: '',
      rules_followed: [],
      timeframe_analysis: [],
      isLiveTrade: false,
      isClosed: false,
    });
    setScreenshots([]);
    setWeeklyBiasChecklist({});
    setStrategyChecklist({});
    setCurrentPrice(null);
    setPriceTimestamp(null);
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setTrade(prev => ({ ...prev, [field]: value }));
  };

  const startLiveTrade = () => {
    setTrade(prev => ({
      ...prev,
      isLiveTrade: true,
      entry_datetime: new Date().toISOString(),
      isClosed: false,
      exit_datetime: ''
    }));
  };

  const closeLiveTrade = () => {
    setTrade(prev => ({
      ...prev,
      isClosed: true,
      exit_datetime: new Date().toISOString()
    }));
  };

  const addTimeframe = () => {
    if (timeframeInput && !trade.timeframe_analysis.includes(timeframeInput)) {
      setTrade(prev => ({
        ...prev,
        timeframe_analysis: [...prev.timeframe_analysis, timeframeInput]
      }));
      setTimeframeInput('');
    }
  };

  const removeTimeframe = (tf) => {
    setTrade(prev => ({
      ...prev,
      timeframe_analysis: prev.timeframe_analysis.filter(t => t !== tf)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-white/10">
        
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
              </h2>
              <p className="text-white/60 mt-1">
                Professional trade logging with prop firm validation
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-8 space-y-4">
            {!trade.isLiveTrade && !trade.isClosed && (
              <div className="flex items-center gap-4">
                <NeonButton
                  type="button"
                  variant="profit"
                  size="sm"
                  onClick={startLiveTrade}
                  icon={Activity}
                >
                  Start Live Trade
                </NeonButton>
                <span className="text-sm text-white/60">
                  Track a trade in real-time
                </span>
              </div>
            )}
            
            {trade.isLiveTrade && !trade.isClosed && (
              <GlassCard variant="medium" neon="primary">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white font-medium">Live Trade Active</span>
                    </div>
                    <NeonButton
                      type="button"
                      variant="loss"
                      size="sm"
                      onClick={closeLiveTrade}
                    >
                      Close Trade
                    </NeonButton>
                  </div>
                  <div className="mt-2 flex gap-6 text-sm text-white/60">
                    <span>Entry: {trade.entry_datetime ? new Date(trade.entry_datetime).toLocaleString() : '-'}</span>
                    <span>Exit: {trade.exit_datetime ? new Date(trade.exit_datetime).toLocaleString() : '-'}</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {Object.keys(weeklyBiasChecklist).length > 0 && (
              <GlassCard variant="light">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Brain size={16} />
                    Weekly Bias Checklist ({trade.instrument.slice(0,3).toUpperCase()})
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(weeklyBiasChecklist).map(([item, checked]) => (
                      <label key={item} className="flex items-center text-sm text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setWeeklyBiasChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
                          className="mr-2 w-4 h-4 rounded bg-white/10 border-white/20"
                          disabled={trade.isClosed}
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {Object.keys(strategyChecklist).length > 0 && (
              <GlassCard variant="light">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Target size={16} />
                    Strategy Checklist ({trade.strategy_tag})
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(strategyChecklist).map(([item, checked]) => (
                      <label key={item} className="flex items-center text-sm text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setStrategyChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
                          className="mr-2 w-4 h-4 rounded bg-white/10 border-white/20"
                          disabled={trade.isClosed}
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <GlassCard title="Trade Information" icon={BarChart}>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TradingInput
                      label="Trade Date"
                      type="date"
                      value={trade.date}
                      onChange={handleInputChange('date')}
                      required
                      disabled={trade.isClosed}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Account *
                      </label>
                      <select
                        value={trade.account}
                        onChange={handleInputChange('account')}
                        className="w-full h-12 px-4 rounded-lg bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                        required
                        disabled={trade.isClosed}
                      >
                        <option value="">Select Account</option>
                        {accounts.map(account => (
                          <option key={account.account_name} value={account.account_name}>
                            {account.account_name} - {account.prop_firm} (${account.capital_size?.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <TradingInput
                      label="Instrument"
                      value={trade.instrument}
                      onChange={handleInputChange('instrument')}
                      placeholder="e.g., EURUSD, GBPJPY"
                      required
                      disabled={trade.isClosed}
                    />

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Direction *
                      </label>
                      <div className="flex space-x-2">
                        <NeonButton
                          type="button"
                          variant={trade.direction === 'long' ? 'profit' : 'glass'}
                          size="md"
                          onClick={() => setTrade(prev => ({ ...prev, direction: 'long' }))}
                          className="flex-1"
                          disabled={trade.isClosed}
                          icon={TrendingUp}
                        >
                          Long
                        </NeonButton>
                        <NeonButton
                          type="button"
                          variant={trade.direction === 'short' ? 'loss' : 'glass'}
                          size="md"
                          onClick={() => setTrade(prev => ({ ...prev, direction: 'short' }))}
                          className="flex-1"
                          disabled={trade.isClosed}
                          icon={TrendingDown}
                        >
                          Short
                        </NeonButton>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Market Data & Pricing" icon={Activity}>
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Current Market Price
                      </label>
                      <div className="flex space-x-2">
                        <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-lg font-mono text-white">
                            {currentPrice ? currentPrice : 'Click fetch to get price'}
                          </span>
                          {priceTimestamp && (
                            <div className="text-xs text-white/40 mt-1">
                              Updated: {priceTimestamp}
                            </div>
                          )}
                        </div>
                        <NeonButton
                          type="button"
                          variant="glass"
                          size="sm"
                          onClick={() => fetchCurrentPrice(trade.instrument)}
                          disabled={!trade.instrument}
                          icon={RefreshCw}
                        >
                          Fetch
                        </NeonButton>
                      </div>
                    </div>
                    
                    {currentPrice && (
                      <NeonButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTrade(prev => ({ ...prev, entry_price: currentPrice }))}
                      >
                        Use as Entry
                      </NeonButton>
                    )}
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Execution Details" icon={Zap}>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TradingInput
                      label="Entry Price"
                      type="number"
                      step="0.00001"
                      value={trade.entry_price}
                      onChange={handleInputChange('entry_price')}
                      prefix="$"
                      required
                      disabled={trade.isClosed}
                    />

                    <TradingInput
                      label="Exit Price"
                      type="number"
                      step="0.00001"
                      value={trade.exit_price}
                      onChange={handleInputChange('exit_price')}
                      prefix="$"
                      required
                      disabled={trade.isClosed}
                    />

                    <TradingInput
                      label="Position Size"
                      type="number"
                      step="0.01"
                      value={trade.size}
                      onChange={handleInputChange('size')}
                      suffix="units"
                      required
                      disabled={trade.isClosed}
                    />

                    <TradingInput
                      label="Stop Loss"
                      type="number"
                      step="0.00001"
                      value={trade.stop_loss}
                      onChange={handleInputChange('stop_loss')}
                      prefix="$"
                      disabled={trade.isClosed}
                    />

                    <TradingInput
                      label="Take Profit"
                      type="number"
                      step="0.00001"
                      value={trade.take_profit}
                      onChange={handleInputChange('take_profit')}
                      prefix="$"
                      disabled={trade.isClosed}
                    />

                    <TradingInput
                      label="Risk Amount"
                      type="number"
                      step="0.01"
                      value={trade.risk_amount}
                      onChange={handleInputChange('risk_amount')}
                      prefix="$"
                      disabled={trade.isClosed}
                    />
                  </div>

                  <div className="mt-4">
                    <NeonButton
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={calculateOptimalPosition}
                      disabled={!trade.entry_price || !trade.stop_loss || !trade.account || trade.isClosed}
                      icon={Calculator}
                    >
                      Calculate Optimal Position Size
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Trade Screenshots" icon={Camera}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Upload Screenshots (Charts, Entry/Exit points)
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-white/40 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label htmlFor="screenshot-upload" className="cursor-pointer">
                        <div className="text-center">
                          <Camera size={48} className="mx-auto text-white/40 mb-4" />
                          <p className="text-white/80 font-medium">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-white/40 mt-1">
                            PNG, JPG up to 10MB each • Multiple files supported
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {uploadingScreenshots && (
                      <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                          <span className="text-sm text-blue-400">
                            Uploading to Google Drive...
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {screenshots.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-white/80 mb-3">
                          Uploaded Screenshots ({screenshots.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {screenshots.map((screenshot, index) => (
                            <div key={index} className="relative group">
                              <div className="relative overflow-hidden rounded-lg border-2 border-white/10">
                                <img
                                  src={screenshot.preview}
                                  alt={`Screenshot ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeScreenshot(index)}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="mt-2">
                                <input
                                  type="text"
                                  placeholder="Label (e.g., Entry Point)"
                                  value={screenshot.label}
                                  onChange={(e) => {
                                    const newScreenshots = [...screenshots];
                                    newScreenshots[index].label = e.target.value;
                                    setScreenshots(newScreenshots);
                                  }}
                                  className="w-full text-sm p-2 rounded bg-white/5 border border-white/10 text-white placeholder-white/30"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Trading Psychology & Strategy" icon={Brain}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Strategy
                    </label>
                    <select
                      value={trade.strategy_tag}
                      onChange={handleInputChange('strategy_tag')}
                    >
                      {Object.keys(strategyChecklists).map(strategy => (
                        <option key={strategy} value={strategy}>
                          {strategy}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
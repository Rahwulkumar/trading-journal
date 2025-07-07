import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Edit3, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain,
  Heart,
  Eye,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  DollarSign
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';
import TradingInput from "./ui/TradingInput";
import { theme } from '../theme/theme';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const DailyJournal = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [journalData, setJournalData] = useState({});
  const [trades, setTrades] = useState([]);
  const [todaysTrades, setTodaysTrades] = useState([]);
  const [notes, setNotes] = useState([]);

  const emotionEmojis = {
    confident: '😎',
    calm: '😌',
    excited: '🤩',
    nervous: '😰',
    frustrated: '😤',
    anxious: '😟',
    focused: '🎯',
    impatient: '⏰',
    disciplined: '💪',
    fearful: '😨'
  };

  const [editableJournal, setEditableJournal] = useState({
    marketConditions: '',
    preMarketMindset: '',
    executionQuality: 5,
    emotionalControl: 5,
    riskManagement: 5,
    lessonsLearned: '',
    tomorrowFocus: '',
    overallRating: 5,
    tradingHours: 0,
    emotions: [],
    winStreak: 0,
    lossStreak: 0,
    bestSetup: '',
    worstSetup: '',
    marketBias: 'neutral'
  });

  // Load data on date change
  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  // Load trades from localStorage on mount
  useEffect(() => {
    loadAllTrades();
  }, []);

  const loadAllTrades = () => {
    try {
      const storedTrades = JSON.parse(localStorage.getItem('tradesync_trades') || '[]');
      console.log('Loaded trades from localStorage:', storedTrades.length);
      setTrades(storedTrades);
      
      // Filter today's trades
      const today = selectedDate;
      const filtered = storedTrades.filter(trade => {
        const tradeDate = trade.date || trade.entry_datetime?.split('T')[0] || trade.created_date?.split('T')[0];
        return tradeDate === today;
      });
      
      console.log(`Trades for ${today}:`, filtered.length);
      setTodaysTrades(filtered);
      
      if (filtered.length > 0) {
        calculateDailySummary(filtered);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
      setTodaysTrades([]);
    }
  };

  const fetchDailyData = async () => {
    try {
      // Load from localStorage first
      loadAllTrades();
      
      // Load journal data
      const journalKey = `journal_${selectedDate}`;
      const savedJournal = localStorage.getItem(journalKey);
      
      if (savedJournal) {
        try {
          const parsedJournal = JSON.parse(savedJournal);
          console.log('Loaded journal for', selectedDate, ':', parsedJournal);
          setEditableJournal(parsedJournal);
        } catch (e) {
          console.error('Error parsing saved journal:', e);
        }
      } else {
        // Reset to default if no journal exists
        setEditableJournal({
          marketConditions: '',
          preMarketMindset: '',
          executionQuality: 5,
          emotionalControl: 5,
          riskManagement: 5,
          lessonsLearned: '',
          tomorrowFocus: '',
          overallRating: 5,
          tradingHours: 0,
          emotions: [],
          winStreak: 0,
          lossStreak: 0,
          bestSetup: '',
          worstSetup: '',
          marketBias: 'neutral'
        });
      }

      // Try to fetch from API as backup
      try {
        const [tradesResponse, notesResponse] = await Promise.all([
          fetch(`http://localhost:8000/trades/?date=${selectedDate}`).catch(() => null),
          fetch(`http://localhost:8000/notes/?date=${selectedDate}`).catch(() => null)
        ]);

        if (tradesResponse && tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          setTodaysTrades(tradesData);
          calculateDailySummary(tradesData);
        }

        if (notesResponse && notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);
          
          if (notesData.length > 0) {
            const journalNote = notesData.find(note => note.content.startsWith('JOURNAL:'));
            if (journalNote) {
              const journalContent = JSON.parse(journalNote.content.replace('JOURNAL:', ''));
              setEditableJournal(journalContent);
            }
          }
        }
      } catch (apiError) {
        console.log('API not available, using localStorage data only');
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    }
  };

  const calculateDailySummary = (tradesData) => {
    if (!tradesData || tradesData.length === 0) return;

    let totalPnL = 0;
    let wins = 0;
    let losses = 0;
    let bestTrade = 0;
    let worstTrade = 0;
    let totalRMultiple = 0;
    let emotionsMap = {};
    let setupPerformance = {};

    tradesData.forEach(trade => {
      const pnl = calculatePnL(trade);
      totalPnL += pnl;
      
      if (pnl > 0) {
        wins++;
        if (pnl > bestTrade) bestTrade = pnl;
      } else {
        losses++;
        if (pnl < worstTrade) worstTrade = pnl;
      }

      const rMultiple = trade.risk_amount ? pnl / trade.risk_amount : 0;
      totalRMultiple += rMultiple;

      if (trade.pre_emotion) {
        emotionsMap[trade.pre_emotion] = (emotionsMap[trade.pre_emotion] || 0) + 1;
      }

      if (trade.strategy_tag) {
        if (!setupPerformance[trade.strategy_tag]) {
          setupPerformance[trade.strategy_tag] = { wins: 0, losses: 0, pnl: 0 };
        }
        setupPerformance[trade.strategy_tag].pnl += pnl;
        if (pnl > 0) {
          setupPerformance[trade.strategy_tag].wins++;
        } else {
          setupPerformance[trade.strategy_tag].losses++;
        }
      }
    });

    const bestSetup = Object.entries(setupPerformance)
      .sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] || '';
    const worstSetup = Object.entries(setupPerformance)
      .sort((a, b) => a[1].pnl - b[1].pnl)[0]?.[0] || '';

    setEditableJournal(prev => ({
      ...prev,
      emotions: Object.keys(emotionsMap),
      bestSetup,
      worstSetup
    }));
  };

  const calculatePnL = (trade) => {
    const direction = trade.direction?.toLowerCase() || 'long';
    const entryPrice = parseFloat(trade.entry_price || 0);
    const exitPrice = parseFloat(trade.exit_price || 0);
    const size = parseFloat(trade.size || 0);
    const fees = parseFloat(trade.fees || 0);

    if (!entryPrice || !exitPrice || !size) {
      return parseFloat(trade.pnl || 0); // Use stored PnL if calculation inputs missing
    }

    if (direction === 'long') {
      return ((exitPrice - entryPrice) * size) - fees;
    } else {
      return ((entryPrice - exitPrice) * size) - fees;
    }
  };

  const saveJournal = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      const journalKey = `journal_${selectedDate}`;
      const journalData = {
        ...editableJournal,
        lastUpdated: new Date().toISOString(),
        date: selectedDate
      };
      
      localStorage.setItem(journalKey, JSON.stringify(journalData));
      console.log('Journal saved to localStorage:', journalKey, journalData);
      
      // Try to save to API as well
      try {
        const journalContent = `JOURNAL:${JSON.stringify(editableJournal)}`;
        const response = await fetch('http://localhost:8000/notes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            content: journalContent
          })
        });

        if (response.ok) {
          console.log('Journal also saved to API');
        }
      } catch (apiError) {
        console.log('API save failed, but localStorage save succeeded');
      }

      setIsEditing(false);
      alert('Journal saved successfully!');
      
    } catch (error) {
      console.error('Error saving journal:', error);
      alert('Error saving journal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      confident: theme.colors.profit.primary,
      calm: theme.colors.accent.blue,
      excited: theme.colors.accent.purple,
      nervous: theme.colors.accent.amber,
      frustrated: theme.colors.loss.primary,
      anxious: theme.colors.accent.amber,
      focused: theme.colors.accent.blue,
      impatient: theme.colors.accent.amber,
      disciplined: theme.colors.profit.primary,
      fearful: theme.colors.loss.primary
    };
    return colors[emotion] || theme.colors.accent.blue;
  };

  const RatingSlider = ({ label, icon: Icon, value, onChange, disabled }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Icon size={16} />
          {label}
        </span>
        <span className={`text-sm font-bold ${
          value >= 8 ? 'text-green-400' :
          value >= 6 ? 'text-amber-400' :
          'text-red-400'
        }`}>
          {value}/10
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${
              value >= 8 ? theme.colors.profit.primary :
              value >= 6 ? theme.colors.accent.amber :
              theme.colors.loss.primary
            } 0%, ${
              value >= 8 ? theme.colors.profit.primary :
              value >= 6 ? theme.colors.accent.amber :
              theme.colors.loss.primary
            } ${value * 10}%, ${theme.colors.surface.primary} ${value * 10}%, ${theme.colors.surface.primary} 100%)`
          }}
        />
      </div>
    </div>
  );

  // Calculate summary from today's trades
  const summary = todaysTrades.reduce((acc, trade) => {
    const pnl = calculatePnL(trade);
    const rMultiple = trade.risk_amount ? pnl / trade.risk_amount : 0;
    
    return {
      totalTrades: acc.totalTrades + 1,
      totalPnL: acc.totalPnL + pnl,
      winRate: pnl > 0 ? (acc.winRate + (1 / todaysTrades.length * 100)) : acc.winRate,
      averageR: acc.averageR + (rMultiple / todaysTrades.length),
      bestTrade: Math.max(acc.bestTrade, pnl),
      worstTrade: Math.min(acc.worstTrade, pnl),
      tradingHours: acc.tradingHours
    };
  }, {
    totalTrades: 0,
    totalPnL: 0,
    winRate: 0,
    averageR: 0,
    bestTrade: 0,
    worstTrade: 0,
    tradingHours: editableJournal.tradingHours
  });

  const emotionData = Object.entries(
    todaysTrades.reduce((acc, trade) => {
      if (trade.pre_emotion) {
        acc[trade.pre_emotion] = (acc[trade.pre_emotion] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([emotion, count]) => ({
    emotion,
    count,
    emoji: emotionEmojis[emotion] || '😐'
  }));

  const performanceRadarData = [
    { metric: 'Execution', value: editableJournal.executionQuality, fullMark: 10 },
    { metric: 'Emotions', value: editableJournal.emotionalControl, fullMark: 10 },
    { metric: 'Risk Mgmt', value: editableJournal.riskManagement, fullMark: 10 },
    { metric: 'Overall', value: editableJournal.overallRating, fullMark: 10 },
    { metric: 'Discipline', value: todaysTrades.filter(t => t.rules_followed?.length > 0).length / Math.max(todaysTrades.length, 1) * 10, fullMark: 10 },
    { metric: 'Profit', value: summary.totalPnL > 0 ? 8 : 3, fullMark: 10 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
              Daily Trading Journal
            </h1>
            <p className="text-white/60">
              Track your trades, emotions, and insights for continuous improvement
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => navigateDay(-1)}
                icon={ChevronLeft}
              />
              
              <TradingInput
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
              
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => navigateDay(1)}
                icon={ChevronRight}
              />
            </div>

            <NeonButton
              variant={isEditing ? "profit" : "primary"}
              onClick={isEditing ? saveJournal : () => setIsEditing(true)}
              loading={isSaving}
              icon={isEditing ? Save : Edit3}
            >
              {isEditing ? 'Save Journal' : 'Edit Journal'}
            </NeonButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard
            variant="medium"
            neon={summary.totalPnL > 0 ? 'profit' : 'loss'}
            gradient={summary.totalPnL > 0 ? 'profit' : 'loss'}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Daily P&L</span>
                <DollarSign size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.totalPnL > 0 ? '+' : ''}$
                {summary.totalPnL.toLocaleString()}
              </div>
              <div className="text-sm text-white/60 mt-1">
                {summary.totalTrades} trades
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
                {summary.winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-white/60 mt-1">
                Success rate
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Avg R-Multiple</span>
                <Activity size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.averageR > 0 ? '+' : ''}
                {summary.averageR.toFixed(2)}R
              </div>
              <div className="text-sm text-white/60 mt-1">
                Risk efficiency
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Trading Hours</span>
                <Clock size={20} className="text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white">
                {editableJournal.tradingHours.toFixed(1)}h
              </div>
              <div className="text-sm text-white/60 mt-1">
                Time in market
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <GlassCard 
              title="Today's Trades" 
              subtitle={`${todaysTrades.length} executions`}
              icon={BarChart3}
            >
              <div className="p-6">
                {todaysTrades.length > 0 ? (
                  <div className="space-y-4">
                    {todaysTrades.map((trade) => (
                      <div key={trade.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              trade.direction === 'long' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.direction === 'long' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {trade.instrument}
                              </div>
                              <div className="text-sm text-white/60">
                                {trade.entry_datetime ? new Date(trade.entry_datetime).toLocaleTimeString() : 'N/A'} • {trade.strategy_tag}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              calculatePnL(trade) > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {calculatePnL(trade) > 0 ? '+' : ''}${calculatePnL(trade).toFixed(2)}
                            </div>
                            <div className="text-sm text-white/60">
                              {trade.risk_amount ? (calculatePnL(trade) / trade.risk_amount).toFixed(2) : '0'}R
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Entry:</span>
                            <div className="font-medium text-white">{trade.entry_price}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Exit:</span>
                            <div className="font-medium text-white">{trade.exit_price}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Size:</span>
                            <div className="font-medium text-white">{trade.size}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Setup:</span>
                            <div className="font-medium text-white">{trade.trade_type || 'N/A'}</div>
                          </div>
                        </div>

                        {trade.pre_emotion && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Heart size={14} className="text-white/40" />
                                <span className="text-sm font-medium capitalize" 
                                  style={{ color: getEmotionColor(trade.pre_emotion) }}>
                                  {emotionEmojis[trade.pre_emotion]} {trade.pre_emotion}
                                </span>
                              </div>
                              <div className={`text-sm font-medium ${
                                calculatePnL(trade) > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {calculatePnL(trade) > 0 ? 'WIN' : 'LOSS'}
                              </div>
                            </div>
                            {trade.rationale && (
                              <p className="text-sm text-white/60 italic mt-2">
                                "{trade.rationale}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/60">No trades recorded for this date</p>
                    <p className="text-sm text-white/40 mt-1">
                      Trades will appear here once you log them
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="Emotion Distribution" icon={Heart}>
                <div className="p-6">
                  {emotionData.length > 0 ? (
                    <div className="space-y-3">
                      {emotionData.map((item) => (
                        <div key={item.emotion} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-white/80 capitalize">{item.emotion}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-white/10 rounded-full h-2">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${(item.count / todaysTrades.length) * 100}%`,
                                  backgroundColor: getEmotionColor(item.emotion)
                                }}
                              />
                            </div>
                            <span className="text-sm text-white/60 w-12 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-white/40 py-8">
                      No emotion data available
                    </p>
                  )}
                </div>
              </GlassCard>

              <GlassCard title="Performance Radar" icon={Zap}>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={performanceRadarData}>
                      <PolarGrid 
                        stroke={theme.colors.border.primary} 
                        radialLines={false}
                      />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: theme.colors.text.secondary, fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 10]} 
                        tick={false}
                        axisLine={false}
                      />
                      <Radar 
                        name="Performance" 
                        dataKey="value" 
                        stroke={theme.colors.accent.blue}
                        fill={theme.colors.accent.blue}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="space-y-6">
            
            <GlassCard title="Daily Reflection" subtitle="Insights and analysis" icon={BookOpen}>
              <div className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Market Conditions
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editableJournal.marketConditions}
                      onChange={(e) => setEditableJournal(prev => ({ ...prev, marketConditions: e.target.value }))}
                      placeholder="How were the markets today? Trending, ranging, volatile?"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      rows="2"
                    />
                  ) : (
                    <p className="text-white/60 text-sm p-3 bg-white/5 rounded-lg">
                      {editableJournal.marketConditions || 'No market analysis recorded'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Pre-Market Mindset
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editableJournal.preMarketMindset}
                      onChange={(e) => setEditableJournal(prev => ({ ...prev, preMarketMindset: e.target.value }))}
                      placeholder="How did you feel before trading? What was your preparation?"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      rows="2"
                    />
                  ) : (
                    <p className="text-white/60 text-sm p-3 bg-white/5 rounded-lg">
                      {editableJournal.preMarketMindset || 'No pre-market notes recorded'}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white/80">Performance Ratings</h4>
                  
                  <RatingSlider
                    label="Execution Quality"
                    icon={Target}
                    value={editableJournal.executionQuality}
                    onChange={(value) => setEditableJournal(prev => ({ ...prev, executionQuality: value }))}
                    disabled={!isEditing}
                  />
                  
                  <RatingSlider
                    label="Emotional Control"
                    icon={Heart}
                    value={editableJournal.emotionalControl}
                    onChange={(value) => setEditableJournal(prev => ({ ...prev, emotionalControl: value }))}
                    disabled={!isEditing}
                  />
                  
                  <RatingSlider
                    label="Risk Management"
                    icon={Shield}
                    value={editableJournal.riskManagement}
                    onChange={(value) => setEditableJournal(prev => ({ ...prev, riskManagement: value }))}
                    disabled={!isEditing}
                  />

                  <RatingSlider
                    label="Overall Performance"
                    icon={Award}
                    value={editableJournal.overallRating}
                    onChange={(value) => setEditableJournal(prev => ({ ...prev, overallRating: value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Learning & Growth" subtitle="Continuous improvement" icon={Brain}>
              <div className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <BookOpen size={16} />
                    Lessons Learned
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editableJournal.lessonsLearned}
                      onChange={(e) => setEditableJournal(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="What did you learn today? What would you do differently?"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      rows="3"
                    />
                  ) : (
                    <p className="text-white/60 text-sm p-3 bg-white/5 rounded-lg">
                      {editableJournal.lessonsLearned || 'No lessons recorded'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <Target size={16} />
                    Tomorrow's Focus
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editableJournal.tomorrowFocus}
                      onChange={(e) => setEditableJournal(prev => ({ ...prev, tomorrowFocus: e.target.value }))}
                      placeholder="What will you focus on tomorrow? What's your plan?"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      rows="3"
                    />
                  ) : (
                    <p className="text-white/60 text-sm p-3 bg-white/5 rounded-lg">
                      {editableJournal.tomorrowFocus || 'No focus areas set'}
                    </p>
                  )}
                </div>

                {editableJournal.bestSetup && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400 flex items-center gap-2">
                        <Award size={16} />
                        Best Setup Today
                      </span>
                      <span className="font-medium text-green-400">
                        {editableJournal.bestSetup}
                      </span>
                    </div>
                  </div>
                )}

                {editableJournal.worstSetup && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Worst Setup Today
                      </span>
                      <span className="font-medium text-red-400">
                        {editableJournal.worstSetup}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
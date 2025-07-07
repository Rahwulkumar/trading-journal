// 🏪 Advanced Trading Journal State Management
// Sophisticated state architecture for real-time trading data

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 🎯 Advanced Trading Store with Real-time Capabilities
export const useTradingStore = create()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // 💰 Trading Data State
          trades: [],
          accounts: [],
          strategies: [],
          weeklyBiases: [],
          notes: [],
          
          // 📊 Real-time Analytics State
          analytics: {
            summary: {
              totalTrades: 0,
              winRate: 0,
              averageRMultiple: 0,
              totalPnL: 0,
              bestTrade: null,
              worstTrade: null,
              activeStreak: 0,
              drawdown: 0
            },
            performance: {
              daily: [],
              weekly: [],
              monthly: []
            },
            charts: {
              pnlCurve: [],
              winRateHistory: [],
              volumeAnalysis: [],
              timeOfDayPerformance: []
            }
          },

          // 🎛️ UI State Management
          ui: {
            theme: 'dark',
            activeView: 'dashboard',
            selectedAccount: null,
            selectedDateRange: {
              start: null,
              end: null
            },
            filters: {
              instruments: [],
              strategies: [],
              tradingTypes: []
            },
            modals: {
              tradeForm: false,
              accountManager: false,
              strategyManager: false,
              reports: false
            },
            notifications: [],
            loading: {
              trades: false,
              analytics: false,
              charts: false
            }
          },

          // 🔄 Real-time Connection State
          realtime: {
            connected: false,
            lastUpdate: null,
            connectionStatus: 'disconnected',
            subscriptions: new Set()
          },

          // 📈 Chart State Management
          charts: {
            activeChart: null,
            timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
            selectedTimeframe: '1h',
            indicators: [],
            overlays: [],
            annotations: []
          },

          // ⚡ Actions - Trading Data Management
          actions: {
            // Trade Management
            addTrade: (trade) => set((state) => {
              state.trades.unshift({
                ...trade,
                id: Date.now(),
                timestamp: new Date().toISOString()
              });
              state.actions.recalculateAnalytics();
            }),

            updateTrade: (tradeId, updates) => set((state) => {
              const index = state.trades.findIndex(t => t.id === tradeId);
              if (index !== -1) {
                state.trades[index] = { ...state.trades[index], ...updates };
                state.actions.recalculateAnalytics();
              }
            }),

            deleteTrade: (tradeId) => set((state) => {
              state.trades = state.trades.filter(t => t.id !== tradeId);
              state.actions.recalculateAnalytics();
            }),

            // Account Management
            addAccount: (account) => set((state) => {
              state.accounts.push({
                ...account,
                id: Date.now(),
                createdAt: new Date().toISOString()
              });
            }),

            updateAccount: (accountId, updates) => set((state) => {
              const index = state.accounts.findIndex(a => a.id === accountId);
              if (index !== -1) {
                state.accounts[index] = { ...state.accounts[index], ...updates };
              }
            }),

            deleteAccount: (accountId) => set((state) => {
              state.accounts = state.accounts.filter(a => a.id !== accountId);
            }),

            // Strategy Management
            addStrategy: (strategy) => set((state) => {
              state.strategies.push({
                ...strategy,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                performance: {
                  totalTrades: 0,
                  winRate: 0,
                  avgPnL: 0
                }
              });
            }),

            updateStrategy: (strategyId, updates) => set((state) => {
              const index = state.strategies.findIndex(s => s.id === strategyId);
              if (index !== -1) {
                state.strategies[index] = { ...state.strategies[index], ...updates };
              }
            }),

            deleteStrategy: (strategyId) => set((state) => {
              state.strategies = state.strategies.filter(s => s.id !== strategyId);
            }),

            // Analytics Calculation
            recalculateAnalytics: () => set((state) => {
              const { trades } = state;
              
              if (trades.length === 0) {
                state.analytics.summary = {
                  totalTrades: 0,
                  winRate: 0,
                  averageRMultiple: 0,
                  totalPnL: 0,
                  bestTrade: null,
                  worstTrade: null,
                  activeStreak: 0,
                  drawdown: 0
                };
                return;
              }

              // Calculate basic metrics
              const totalTrades = trades.length;
              const winningTrades = trades.filter(t => t.pnl > 0);
              const winRate = (winningTrades.length / totalTrades) * 100;
              const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
              
              // Find best and worst trades
              const bestTrade = trades.reduce((best, current) => 
                (current.pnl || 0) > (best?.pnl || -Infinity) ? current : best
              );
              const worstTrade = trades.reduce((worst, current) => 
                (current.pnl || 0) < (worst?.pnl || Infinity) ? current : worst
              );

              // Calculate streak
              let activeStreak = 0;
              for (let i = 0; i < trades.length; i++) {
                const trade = trades[i];
                if (trade.pnl > 0) {
                  activeStreak++;
                } else {
                  break;
                }
              }

              // Calculate R-multiple average
              const rMultiples = trades
                .filter(t => t.riskAmount && t.riskAmount > 0)
                .map(t => (t.pnl || 0) / t.riskAmount);
              
              const averageRMultiple = rMultiples.length > 0 
                ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length 
                : 0;

              // Update summary
              state.analytics.summary = {
                totalTrades,
                winRate: Math.round(winRate * 100) / 100,
                averageRMultiple: Math.round(averageRMultiple * 100) / 100,
                totalPnL: Math.round(totalPnL * 100) / 100,
                bestTrade,
                worstTrade,
                activeStreak,
                drawdown: 0 // TODO: Implement proper drawdown calculation
              };
            }),

            // UI State Management
            setTheme: (theme) => set((state) => {
              state.ui.theme = theme;
            }),

            setActiveView: (view) => set((state) => {
              state.ui.activeView = view;
            }),

            setSelectedAccount: (accountId) => set((state) => {
              state.ui.selectedAccount = accountId;
            }),

            setDateRange: (start, end) => set((state) => {
              state.ui.selectedDateRange = { start, end };
            }),

            updateFilters: (filters) => set((state) => {
              state.ui.filters = { ...state.ui.filters, ...filters };
            }),

            openModal: (modalName) => set((state) => {
              state.ui.modals[modalName] = true;
            }),

            closeModal: (modalName) => set((state) => {
              state.ui.modals[modalName] = false;
            }),

            addNotification: (notification) => set((state) => {
              state.ui.notifications.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...notification
              });
            }),

            removeNotification: (notificationId) => set((state) => {
              state.ui.notifications = state.ui.notifications.filter(
                n => n.id !== notificationId
              );
            }),

            setLoading: (key, isLoading) => set((state) => {
              state.ui.loading[key] = isLoading;
            }),

            // Real-time Management
            setConnectionStatus: (status) => set((state) => {
              state.realtime.connectionStatus = status;
              state.realtime.connected = status === 'connected';
              state.realtime.lastUpdate = new Date().toISOString();
            }),

            addSubscription: (subscription) => set((state) => {
              state.realtime.subscriptions.add(subscription);
            }),

            removeSubscription: (subscription) => set((state) => {
              state.realtime.subscriptions.delete(subscription);
            }),

            // Chart Management
            setActiveChart: (chartData) => set((state) => {
              state.charts.activeChart = chartData;
            }),

            setTimeframe: (timeframe) => set((state) => {
              state.charts.selectedTimeframe = timeframe;
            }),

            addIndicator: (indicator) => set((state) => {
              state.charts.indicators.push(indicator);
            }),

            removeIndicator: (indicatorId) => set((state) => {
              state.charts.indicators = state.charts.indicators.filter(
                i => i.id !== indicatorId
              );
            })
          }
        }))
      ),
      {
        name: 'trading-journal-store',
        partialize: (state) => ({
          trades: state.trades,
          accounts: state.accounts,
          strategies: state.strategies,
          ui: {
            theme: state.ui.theme,
            selectedAccount: state.ui.selectedAccount
          }
        })
      }
    ),
    {
      name: 'trading-journal'
    }
  )
);

// 🎯 Computed Selectors for Optimized Data Access
export const useTradeSelectors = () => {
  const store = useTradingStore();
  
  return {
    // Filtered trades based on current UI filters
    filteredTrades: useTradingStore((state) => {
      let trades = state.trades;
      const { selectedAccount, filters, selectedDateRange } = state.ui;
      
      if (selectedAccount) {
        trades = trades.filter(t => t.account === selectedAccount);
      }
      
      if (filters.instruments.length > 0) {
        trades = trades.filter(t => filters.instruments.includes(t.instrument));
      }
      
      if (filters.strategies.length > 0) {
        trades = trades.filter(t => filters.strategies.includes(t.strategy));
      }
      
      if (selectedDateRange.start && selectedDateRange.end) {
        trades = trades.filter(t => {
          const tradeDate = new Date(t.date);
          return tradeDate >= new Date(selectedDateRange.start) && 
                 tradeDate <= new Date(selectedDateRange.end);
        });
      }
      
      return trades;
    }),

    // Recent trades (last 10)
    recentTrades: useTradingStore((state) => 
      state.trades.slice(0, 10)
    ),

    // Winning trades
    winningTrades: useTradingStore((state) => 
      state.trades.filter(t => t.pnl > 0)
    ),

    // Losing trades
    losingTrades: useTradingStore((state) => 
      state.trades.filter(t => t.pnl <= 0)
    ),

    // Top performing strategies
    topStrategies: useTradingStore((state) => {
      const strategies = {};
      state.trades.forEach(trade => {
        if (!trade.strategy) return;
        if (!strategies[trade.strategy]) {
          strategies[trade.strategy] = { pnl: 0, count: 0, wins: 0 };
        }
        strategies[trade.strategy].pnl += trade.pnl || 0;
        strategies[trade.strategy].count += 1;
        if (trade.pnl > 0) strategies[trade.strategy].wins += 1;
      });
      
      return Object.entries(strategies)
        .map(([name, data]) => ({
          name,
          ...data,
          winRate: (data.wins / data.count) * 100,
          avgPnL: data.pnl / data.count
        }))
        .sort((a, b) => b.avgPnL - a.avgPnL);
    })
  };
};

export default useTradeSelectors;
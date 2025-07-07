// 🎣 useTradeMade Hook - React Hook for TradeMade API Integration
// Location: hooks/useTradeMade.js

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const useTradeMade = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [liveTradesPnL, setLiveTradesPnL] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Get live price for a single currency pair
  const getLivePrice = useCallback(async (symbol) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-price/${symbol.toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch live price');
      }
      
      if (data.success) {
        // Update local price cache
        setLivePrices(prev => ({
          ...prev,
          [symbol.toUpperCase()]: data.data
        }));
        
        setIsLoading(false);
        return data.data;
      } else {
        throw new Error('Failed to fetch price data');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Get live prices for multiple currency pairs
  const getLivePrices = useCallback(async (symbols) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: symbols.map(s => s.toUpperCase()) })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch live prices');
      }
      
      if (data.success) {
        // Update local price cache
        const priceUpdates = {};
        data.data.forEach(priceData => {
          priceUpdates[priceData.symbol] = priceData;
        });
        
        setLivePrices(prev => ({ ...prev, ...priceUpdates }));
        setIsLoading(false);
        return data.data;
      } else {
        throw new Error('Failed to fetch prices data');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Get live P&L for all active trades
  const getLiveTradesPnL = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-trades-pnl`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch live trades P&L');
      }
      
      if (data.success) {
        setLiveTradesPnL(data.data);
        setIsLoading(false);
        return data.data;
      } else {
        throw new Error('Failed to fetch live trades data');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Close a live trade
  const closeLiveTrade = useCallback(async (tradeId, exitPrice = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/close-live-trade/${tradeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exit_price: exitPrice })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to close live trade');
      }
      
      if (data.success) {
        // Refresh live trades P&L after closing
        await getLiveTradesPnL();
        setIsLoading(false);
        return data.data;
      } else {
        throw new Error('Failed to close trade');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [getLiveTradesPnL]);

  // Get historical data for charts
  const getHistoricalData = useCallback(async (symbol, timeframe = '1H', startDate = null, endDate = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        timeframe,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });
      
      const response = await fetch(`${API_BASE_URL}/api/historical-data/${symbol.toUpperCase()}?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch historical data');
      }
      
      if (data.success) {
        setIsLoading(false);
        return data.data;
      } else {
        throw new Error('Failed to fetch historical data');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // WebSocket connection for real-time price streaming
  const connectWebSocket = useCallback((symbols = [], onPriceUpdate = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/live-prices/${clientId}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ TradeMade WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Subscribe to symbols
      if (symbols.length > 0) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          symbols: symbols.map(s => s.toUpperCase())
        }));
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price_update' && message.data) {
          // Update local price cache
          const priceUpdates = {};
          message.data.forEach(priceData => {
            priceUpdates[priceData.symbol] = priceData;
          });
          
          setLivePrices(prev => ({ ...prev, ...priceUpdates }));
          
          // Call custom callback if provided
          if (onPriceUpdate) {
            onPriceUpdate(message.data);
          }
        } else if (message.type === 'error') {
          console.error('WebSocket error:', message.message);
          setError(message.message);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect after 5 seconds if not a manual close
      if (event.code !== 1000 && symbols.length > 0) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connectWebSocket(symbols, onPriceUpdate);
        }, 5000);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Manual disconnect');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  // Subscribe to specific symbols for real-time updates
  const subscribeToSymbols = useCallback((symbols, onPriceUpdate = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbols: symbols.map(s => s.toUpperCase())
      }));
    } else {
      connectWebSocket(symbols, onPriceUpdate);
    }
  }, [connectWebSocket]);

  // Auto-refresh live trades P&L
  const startLiveTradesMonitoring = useCallback((intervalMs = 30000) => {
    // Initial fetch
    getLiveTradesPnL();
    
    // Set up interval
    const interval = setInterval(() => {
      getLiveTradesPnL();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [getLiveTradesPnL]);

  // Calculate live P&L for a specific trade
  const calculateTradePnL = useCallback((trade, currentPrice) => {
    try {
      const entryPrice = parseFloat(trade.entry_price);
      const size = parseFloat(trade.size);
      const fees = parseFloat(trade.fees || 0);
      const direction = trade.direction.toLowerCase();
      
      let pnl = 0;
      if (direction === 'long') {
        pnl = (currentPrice - entryPrice) * size - fees;
      } else {
        pnl = (entryPrice - currentPrice) * size - fees;
      }
      
      return parseFloat(pnl.toFixed(2));
    } catch (err) {
      console.error('Error calculating P&L:', err);
      return 0;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    // State
    isConnected,
    isLoading,
    error,
    livePrices,
    liveTradesPnL,
    
    // Price functions
    getLivePrice,
    getLivePrices,
    getHistoricalData,
    
    // Live trading functions
    getLiveTradesPnL,
    closeLiveTrade,
    calculateTradePnL,
    startLiveTradesMonitoring,
    
    // WebSocket functions
    connectWebSocket,
    disconnectWebSocket,
    subscribeToSymbols,
    
    // Utilities
    clearError: () => setError(null)
  };
};

export default useTradeMade;
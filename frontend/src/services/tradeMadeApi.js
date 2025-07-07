// 📊 TradeMade API Service
// Location: services/tradeMadeApi.js

class TradeMadeAPI {
  constructor() {
    this.baseUrl = 'https://api.trademade.com/v1';
    this.apiKey = process.env.REACT_APP_TRADEMADE_API_KEY || 'your_api_key_here';
    this.wsUrl = 'wss://ws.trademade.com/v1';
    this.socket = null;
    this.subscribers = new Map();
  }

  // Get live price for a currency pair
  async getLivePrice(symbol) {
    try {
      const response = await fetch(`${this.baseUrl}/live?currency=${symbol}&api_key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        symbol: data.currency,
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask),
        mid: parseFloat(data.mid),
        timestamp: new Date(data.timestamp * 1000)
      };
    } catch (error) {
      console.error('Error fetching live price:', error);
      throw error;
    }
  }

  // Get multiple live prices
  async getLivePrices(symbols) {
    try {
      const symbolsStr = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const response = await fetch(`${this.baseUrl}/live?currency=${symbolsStr}&api_key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data.quotes)) {
        return data.quotes.map(quote => ({
          symbol: quote.currency,
          bid: parseFloat(quote.bid),
          ask: parseFloat(quote.ask),
          mid: parseFloat(quote.mid),
          timestamp: new Date(quote.timestamp * 1000)
        }));
      } else {
        // Single quote response
        return [{
          symbol: data.currency,
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask),
          mid: parseFloat(data.mid),
          timestamp: new Date(data.timestamp * 1000)
        }];
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
      throw error;
    }
  }

  // Subscribe to real-time price updates via WebSocket
  subscribeToLivePrices(symbols, callback) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    symbolsArray.forEach(symbol => {
      this.subscribers.set(symbol, callback);
    });

    // Send subscription message when socket is ready
    if (this.socket.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbolsArray);
    } else {
      this.socket.addEventListener('open', () => {
        this.sendSubscription(symbolsArray);
      });
    }

    return () => {
      // Unsubscribe function
      symbolsArray.forEach(symbol => {
        this.subscribers.delete(symbol);
      });
    };
  }

  connectWebSocket() {
    this.socket = new WebSocket(`${this.wsUrl}?api_key=${this.apiKey}`);
    
    this.socket.onopen = () => {
      console.log('TradeMade WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.currency && this.subscribers.has(data.currency)) {
          const callback = this.subscribers.get(data.currency);
          callback({
            symbol: data.currency,
            bid: parseFloat(data.bid),
            ask: parseFloat(data.ask),
            mid: parseFloat(data.mid),
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.subscribers.size > 0) {
          this.connectWebSocket();
        }
      }, 5000);
    };
  }

  sendSubscription(symbols) {
    const message = {
      userKey: this.apiKey,
      symbol: symbols.join(',')
    };
    this.socket.send(JSON.stringify(message));
  }

  // Get historical data for trade analysis
  async getHistoricalData(symbol, timeframe = '1H', from, to) {
    try {
      const params = new URLSearchParams({
        currency: symbol,
        period: timeframe,
        api_key: this.apiKey
      });

      if (from) params.append('start', Math.floor(new Date(from).getTime() / 1000));
      if (to) params.append('end', Math.floor(new Date(to).getTime() / 1000));

      const response = await fetch(`${this.baseUrl}/timeseries?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.quotes?.map(quote => ({
        time: new Date(quote.date),
        open: parseFloat(quote.open),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        close: parseFloat(quote.close)
      })) || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Calculate current P&L for a live trade
  calculateLivePnL(trade, currentPrice) {
    const entryPrice = parseFloat(trade.entry_price);
    const size = parseFloat(trade.size);
    const fees = parseFloat(trade.fees || 0);
    
    let pnl = 0;
    if (trade.direction === 'long') {
      pnl = (currentPrice - entryPrice) * size - fees;
    } else {
      pnl = (entryPrice - currentPrice) * size - fees;
    }
    
    return parseFloat(pnl.toFixed(2));
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscribers.clear();
  }
}

// Create singleton instance
export const tradeMadeAPI = new TradeMadeAPI();
export default tradeMadeAPI;
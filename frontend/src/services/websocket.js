import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
  }

  connect(accountId) {
    if (this.socket) {
      this.disconnect();
    }

    // Connect using native WebSocket for FastAPI
    const wsUrl = `ws://localhost:8000/ws/${accountId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.notifySubscribers('connection', { status: 'connected' });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifySubscribers('error', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.notifySubscribers('connection', { status: 'disconnected' });
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'trade_update':
        this.notifySubscribers('trade_update', data.data);
        break;
      case 'performance_update':
        this.notifySubscribers('performance_update', data.data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketService();
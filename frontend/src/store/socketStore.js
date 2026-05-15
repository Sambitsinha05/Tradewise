import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useNotificationStore } from './notificationStore';

let socket = null;

export const useSocketStore = create((set, get) => ({
  isConnected: false,
  liveWatchlist: [],
  liveStockData: {}, // Map for specific stock subscriptions: { 'AAPL': { currentPrice: 150 } }
  marketOverview: { gainers: [], losers: [], trending: [] },

  connect: (userId) => {
    if (socket?.connected) return;

    // Connect to the backend socket server
    socket = io('https://tradewise-xa7h.onrender.com', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      // Join private user room for alerts and watchlist updates
      if (userId) {
        socket.emit('join_portfolio', userId);
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Handle incoming Market Overview Updates (Global)
    socket.on('market_overview_update', (data) => {
      set({ marketOverview: data });
    });

    // Handle incoming Watchlist Updates (Array of objects)
    socket.on('watchlist_live_update', (data) => {
      set({ liveWatchlist: data });
    });

    // Handle specific Stock Updates
    socket.on('stock_update', (data) => {
      const currentMap = get().liveStockData;
      set({ 
        liveStockData: { 
          ...currentMap, 
          [data.symbol]: data 
        } 
      });
    });

    // Handle ALERTS (Price thresholds and Volatility)
    socket.on('price_alert', (alert) => {
      useNotificationStore.getState().addToast(
        'PRICE_ALERT',
        alert.title || 'Price Alert',
        alert.message
      );
      // Also refresh notifications to show in the panel
      useNotificationStore.getState().fetchNotifications();
    });

    socket.on('volatility_alert', (alert) => {
      useNotificationStore.getState().addToast(
        'RISK_WARNING',
        alert.title || 'Volatility Alert',
        alert.message
      );
      useNotificationStore.getState().fetchNotifications();
    });
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    set({ isConnected: false, liveWatchlist: [], liveStockData: {} });
  },

  // Subscribe to a specific stock (e.g. when viewing a specific stock's chart)
  subscribeToStock: (symbol) => {
    if (socket && socket.connected) {
      socket.emit('subscribe_stock', symbol);
    }
  },

  unsubscribeFromStock: (symbol) => {
    if (socket && socket.connected) {
      socket.emit('unsubscribe_stock', symbol);
    }
  }
}));

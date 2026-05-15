import { getQuote, getMarketGainersLosers } from '../services/marketDataService.js';

// Keep track of active subscriptions: { 'AAPL': Set(socketIds) }
const subscriptions = new Map();
let pollingInterval = null;
let overviewInterval = null;

export default (io, socket) => {
  // Client wants to watch a specific stock
  socket.on('subscribe_stock', (symbol) => {
    symbol = symbol.toUpperCase();
    socket.join(`stock:${symbol}`);
    
    if (!subscriptions.has(symbol)) {
      subscriptions.set(symbol, new Set());
    }
    subscriptions.get(symbol).add(socket.id);

    // Fetch immediately upon subscription
    getQuote(symbol).then(data => {
      socket.emit('stock_update', data);
    }).catch(err => console.error(err));
    
    startPolling(io);
  });

  socket.on('unsubscribe_stock', (symbol) => {
    symbol = symbol.toUpperCase();
    socket.leave(`stock:${symbol}`);
    
    if (subscriptions.has(symbol)) {
      subscriptions.get(symbol).delete(socket.id);
      if (subscriptions.get(symbol).size === 0) {
        subscriptions.delete(symbol);
      }
    }
  });

  // Start global overview broadcast for everyone connected
  startOverviewBroadcast(io);

  socket.on('disconnect', () => {
    subscriptions.forEach((clients, symbol) => {
      clients.delete(socket.id);
      if (clients.size === 0) {
        subscriptions.delete(symbol);
      }
    });
  });
};

// Poll active symbols every 10 seconds to avoid breaking rate limits
const startPolling = (io) => {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    if (subscriptions.size === 0) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      return;
    }

    for (const symbol of subscriptions.keys()) {
      try {
        const data = await getQuote(symbol);
        io.to(`stock:${symbol}`).emit('stock_update', data);
      } catch (error) {
        // Ignore silent fetch errors during polling
      }
    }
  }, 10000); 
};

// Global broadcast for Gainers/Losers/Trending every 15 seconds
const startOverviewBroadcast = (io) => {
  if (overviewInterval) return;

  overviewInterval = setInterval(async () => {
    try {
      const data = await getMarketGainersLosers();
      io.emit('market_overview_update', {
        gainers: data.gainers?.slice(0, 5) || [],
        losers: data.losers?.slice(0, 5) || [],
        trending: data.mostActive?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Overview broadcast error', error);
    }
  }, 15000);
};

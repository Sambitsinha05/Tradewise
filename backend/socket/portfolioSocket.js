import Watchlist from '../models/watchlistModel.js';
import { getQuote } from '../services/marketDataService.js';

let watchlistPollingInterval = null;
const activeUserWatchlists = new Map(); // userId -> socketId

export default (io, socket) => {
  // Client authenticates and joins their private portfolio room
  socket.on('join_portfolio', (userId) => {
    socket.join(`user:${userId}`);
    activeUserWatchlists.set(userId, socket.id);
    
    startWatchlistPolling(io);
  });

  socket.on('leave_portfolio', (userId) => {
    socket.leave(`user:${userId}`);
    activeUserWatchlists.delete(userId);
  });

  socket.on('disconnect', () => {
    // Find and remove user by socket id
    for (const [userId, sockId] of activeUserWatchlists.entries()) {
      if (sockId === socket.id) {
        activeUserWatchlists.delete(userId);
      }
    }
  });
};

const startWatchlistPolling = (io) => {
  if (watchlistPollingInterval) return;

  // Poll every 15 seconds to push live watchlist updates to users looking at their dashboard
  watchlistPollingInterval = setInterval(async () => {
    if (activeUserWatchlists.size === 0) {
      clearInterval(watchlistPollingInterval);
      watchlistPollingInterval = null;
      return;
    }

    for (const userId of activeUserWatchlists.keys()) {
      try {
        const watchlist = await Watchlist.findOne({ user: userId });
        if (!watchlist || watchlist.symbols.length === 0) continue;

        const updates = await Promise.all(
          watchlist.symbols.map(async (item) => {
            try {
              const quote = await getQuote(item.symbol);
              return { symbol: item.symbol, currentPrice: quote.currentPrice, percentChange: quote.percentChange };
            } catch (e) {
              return null;
            }
          })
        );

        // Filter out any failed quotes and emit to the specific user's private room
        const validUpdates = updates.filter(u => u !== null);
        io.to(`user:${userId}`).emit('watchlist_live_update', validUpdates);
      } catch (error) {
        console.error(`Error polling watchlist for user ${userId}`, error);
      }
    }
  }, 15000);
};

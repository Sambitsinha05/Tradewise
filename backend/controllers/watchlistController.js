import Watchlist from '../models/watchlistModel.js';
import { getQuote } from '../services/marketDataService.js';

// @desc    Add a stock to watchlist
// @route   POST /api/watchlist/add
// @access  Private
export const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    const userId = req.user._id;

    if (!symbol) {
      res.status(400);
      throw new Error('Symbol is required');
    }

    let watchlist = await Watchlist.findOne({ user: userId });

    if (!watchlist) {
      watchlist = new Watchlist({ user: userId, symbols: [] });
    }

    // Check if already in watchlist
    const alreadyExists = watchlist.symbols.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
    );

    if (alreadyExists) {
      res.status(400);
      throw new Error('Stock already in watchlist');
    }

    watchlist.symbols.push({
      symbol: symbol.toUpperCase()
    });

    await watchlist.save();
    res.status(201).json(watchlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a stock from watchlist
// @route   DELETE /api/watchlist/remove/:symbol
// @access  Private
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const symbol = req.params.symbol || req.body.symbol;
    const userId = req.user._id;

    if (!symbol) {
      res.status(400);
      throw new Error('Symbol is required');
    }

    let watchlist = await Watchlist.findOne({ user: userId });

    if (!watchlist) {
      res.status(404);
      throw new Error('Watchlist not found');
    }

    watchlist.symbols = watchlist.symbols.filter(
      (s) => s.symbol.toUpperCase() !== symbol.toUpperCase()
    );

    await watchlist.save();
    res.status(200).json(watchlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Get watchlist with live prices and analytics
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const watchlist = await Watchlist.findOne({ user: userId });

    if (!watchlist || watchlist.symbols.length === 0) {
      return res.status(200).json({
        items: [],
        analytics: { greenCount: 0, redCount: 0, averageChangePercent: 0, topGainer: null },
      });
    }

    // Fetch live quotes for all symbols concurrently
    const quotePromises = watchlist.symbols.map(async (item) => {
      try {
        const quote = await getQuote(item.symbol);
        
        // Generate mock sparkline for visuals
        const sparkline = [];
        let tempPrice = quote.currentPrice;
        for (let i = 0; i < 10; i++) {
          tempPrice = tempPrice * (1 + (Math.random() - 0.5) * 0.02);
          sparkline.push({ price: tempPrice });
        }

        return {
          ...item.toObject(),
          currentPrice: quote.currentPrice,
          change: quote.change,
          percentChange: quote.percentChange,
          sparkline: sparkline.reverse(),
        };
      } catch (err) {
        return {
          ...item.toObject(),
          currentPrice: 0,
          change: 0,
          percentChange: 0,
          sparkline: [],
          error: 'Could not fetch live data',
        };
      }
    });

    const populatedWatchlist = await Promise.all(quotePromises);

    // Calculate Analytics
    let greenCount = 0;
    let redCount = 0;
    let totalPercentChange = 0;
    let topGainer = null;

    populatedWatchlist.forEach((item) => {
      if (item.percentChange > 0) greenCount++;
      if (item.percentChange < 0) redCount++;
      
      totalPercentChange += (item.percentChange || 0);

      if (!topGainer || item.percentChange > topGainer.percentChange) {
        if (item.percentChange !== undefined) {
          topGainer = item;
        }
      }
    });

    const averageChangePercent = populatedWatchlist.length > 0 
      ? (totalPercentChange / populatedWatchlist.length).toFixed(2) 
      : 0;

    res.status(200).json({
      items: populatedWatchlist,
      analytics: {
        greenCount,
        redCount,
        averageChangePercent: Number(averageChangePercent),
        topGainer: topGainer ? { symbol: topGainer.symbol, percentChange: topGainer.percentChange } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

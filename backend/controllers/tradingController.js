import { executeBuy, executeSell } from '../services/tradingService.js';
import Portfolio from '../models/portfolioModel.js';
import Transaction from '../models/transactionModel.js';
// Note: In a real app, currentPrice would be fetched securely from the backend via AlphaVantage/Finnhub here,
// rather than trusting the client's currentPrice. For this MVP, we'll accept it from the body but ideally,
// we should have an external API service layer fetching it live.

// @desc    Buy a stock
// @route   POST /api/trading/buy
// @access  Private
export const buyStock = async (req, res, next) => {
  try {
    const { symbol, quantity, currentPrice, name, sector } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || !currentPrice) {
      res.status(400);
      throw new Error('Please provide symbol, quantity, and current price');
    }

    const result = await executeBuy(userId, symbol, Number(quantity), Number(currentPrice), name, sector);

    res.status(200).json({
      success: true,
      message: 'Trade executed',
      transaction: result.transaction,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

// @desc    Sell a stock
// @route   POST /api/trading/sell
// @access  Private
export const sellStock = async (req, res, next) => {
  try {
    const { symbol, quantity, currentPrice } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || !currentPrice) {
      res.status(400);
      throw new Error('Please provide symbol, quantity, and current price');
    }

    const result = await executeSell(userId, symbol, Number(quantity), Number(currentPrice));

    res.status(200).json({
      success: true,
      message: 'Trade executed',
      transaction: result.transaction,
      realizedPnL: result.realizedPnL,
      realizedROI: result.realizedROI,
      averageExitPrice: result.averageExitPrice
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};



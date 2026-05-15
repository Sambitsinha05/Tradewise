import {
  getQuote,
  searchStocks,
  getMarketGainersLosers,
  getTrendingNews,
  getIntradayData,
  getHistoricalData,
} from '../services/marketDataService.js';
import { getExchangeRates } from '../services/currencyService.js';
import { calculateHistoricalMetrics } from '../services/analyticsService.js';

export const getStockQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) { res.status(400); throw new Error('Symbol is required'); }
    const quoteData = await getQuote(symbol);
    res.status(200).json(quoteData);
  } catch (error) { next(error); }
};

export const searchMarket = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);
    const results = await searchStocks(query);
    res.status(200).json(results);
  } catch (error) { next(error); }
};

export const getGainers = async (req, res, next) => {
  try {
    const data = await getMarketGainersLosers();
    res.status(200).json(data);
  } catch (error) { next(error); }
};

export const getTrending = async (req, res, next) => {
  try {
    const news = await getTrendingNews();
    res.status(200).json(news);
  } catch (error) { next(error); }
};

export const getCurrencyRates = async (req, res, next) => {
  try {
    const rates = await getExchangeRates();
    res.status(200).json(rates);
  } catch (error) { next(error); }
};

export const getMarketAnalytics = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const analytics = await calculateHistoricalMetrics(symbol);
    res.status(200).json(analytics);
  } catch (error) { next(error); }
};

// @desc    Get intraday 1-min bars for a symbol
// @route   GET /api/market/intraday/:symbol
export const getIntraday = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const points = parseInt(req.query.points) || 390;
    const data = getIntradayData(symbol, points);
    res.status(200).json(data);
  } catch (error) { next(error); }
};

// @desc    Get multi-day OHLCV + SMAs for a symbol
// @route   GET /api/market/history/:symbol?days=90
export const getStockHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days) || 90;
    const data = getHistoricalData(symbol, days);
    res.status(200).json(data);
  } catch (error) { next(error); }
};

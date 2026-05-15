import Portfolio from '../models/portfolioModel.js';
import PortfolioSnapshot from '../models/portfolioSnapshotModel.js';
import Transaction from '../models/transactionModel.js';
import User from '../models/userModel.js';
import { generatePortfolioAnalytics } from '../services/analyticsService.js';
import { calculatePortfolioValuation } from '../services/valuationService.js';

// @desc    Get complete portfolio summary (balance, total value, risk metrics)
// @route   GET /api/portfolio
// @access  Private
export const getPortfolioSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('virtualBalance');
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(200).json({
        virtualBalance: user.virtualBalance,
        totalRealizedPnL: 0,
        healthScore: null,
        riskMetrics: null,
        holdingsCount: 0,
      });
    }

    res.status(200).json({
      virtualBalance: user.virtualBalance,
      totalRealizedPnL: portfolio.totalRealizedPnL,
      healthScore: portfolio.healthScore,
      riskMetrics: portfolio.riskMetrics,
      holdingsCount: portfolio.holdings.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's current holdings
// @route   GET /api/portfolio/holdings
// @access  Private
export const getHoldings = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(200).json([]);
    }

    res.status(200).json(portfolio.holdings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical portfolio data for charts
// @route   GET /api/portfolio/history
// @access  Private
export const getPortfolioHistory = async (req, res, next) => {
  try {
    const { timeframe = '1M' } = req.query; // 1W, 1M, 3M, 1Y, ALL

    let dateFilter = new Date();
    if (timeframe === '1W') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeframe === '1M') dateFilter.setMonth(dateFilter.getMonth() - 1);
    else if (timeframe === '3M') dateFilter.setMonth(dateFilter.getMonth() - 3);
    else if (timeframe === '1Y') dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    else dateFilter = new Date(0); // All time

    const snapshots = await PortfolioSnapshot.find({
      user: req.user._id,
      date: { $gte: dateFilter },
    }).sort({ date: 1 });

    res.status(200).json(snapshots);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's transaction history
// @route   GET /api/portfolio/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ user: req.user._id });

    res.status(200).json({
      transactions,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get advanced portfolio analytics (health, risk, cagr)
// @route   GET /api/portfolio/analytics
// @access  Private
export const getPortfolioAnalytics = async (req, res, next) => {
  try {
    const analytics = await generatePortfolioAnalytics(req.user._id);
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioValuation = async (req, res, next) => {
  try {
    const valuation = await calculatePortfolioValuation(req.user._id);
    res.status(200).json(valuation);
  } catch (error) {
    next(error);
  }
};

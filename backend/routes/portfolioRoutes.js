import express from 'express';
import {
  getPortfolioSummary,
  getHoldings,
  getPortfolioHistory,
  getTransactions,
  getPortfolioAnalytics,
  getPortfolioValuation,
} from '../controllers/portfolioController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All portfolio routes are protected
router.use(protect);

router.get('/', getPortfolioSummary);
router.get('/holdings', getHoldings);
router.get('/history', getPortfolioHistory);
router.get('/transactions', getTransactions);
router.get('/analytics', getPortfolioAnalytics);
router.get('/valuation', getPortfolioValuation);

export default router;

import express from 'express';
import {
  getStockQuote,
  searchMarket,
  getGainers,
  getTrending,
  getCurrencyRates,
  getMarketAnalytics,
  getIntraday,
  getStockHistory,
} from '../controllers/marketController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/stock/:symbol', getStockQuote);
router.get('/intraday/:symbol', getIntraday);
router.get('/history/:symbol', getStockHistory);
router.get('/search', searchMarket);
router.get('/gainers', getGainers);
router.get('/trending', getTrending);
router.get('/currencies', getCurrencyRates);
router.get('/analytics/:symbol', getMarketAnalytics);

export default router;

import express from 'express';
import {
  buyStock,
  sellStock,
} from '../controllers/tradingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // All trading routes require authentication

router.post('/buy', buyStock);
router.post('/sell', sellStock);

export default router;

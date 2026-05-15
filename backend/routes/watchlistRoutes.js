import express from 'express';
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/add', addToWatchlist);
router.post('/remove', removeFromWatchlist); // Using POST /remove to match common frontend body payload
router.delete('/remove/:symbol', removeFromWatchlist); // Keep for REST consistency

export default router;

import express from 'express';
import {
  createJournalEntry,
  getJournalEntries,
  getJournalAnalytics,
} from '../controllers/journalController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getJournalEntries);
router.post('/', createJournalEntry);
router.get('/analytics', getJournalAnalytics);

export default router;

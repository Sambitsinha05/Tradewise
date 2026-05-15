import express from 'express';
import { setupDemoPortfolio } from '../controllers/demoController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/setup', protect, setupDemoPortfolio);

export default router;

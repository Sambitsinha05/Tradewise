import express from 'express';
import {
  getAlerts,
  createOrToggleAlert,
  deleteAlert
} from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.post('/', createOrToggleAlert);
router.delete('/:symbol', deleteAlert);

export default router;

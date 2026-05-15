import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  clearAll
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/mark-all-read', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);
router.delete('/', protect, clearAll);

export default router;

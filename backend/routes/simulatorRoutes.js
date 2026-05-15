import express from 'express';
import { calculateSimulation } from '../controllers/simulatorController.js';
// We could use the protect middleware if we want to save user simulations later, 
// but for a calculator, it can be public or private. Let's make it private for now to match the app theme.
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/calculate', protect, calculateSimulation);

export default router;

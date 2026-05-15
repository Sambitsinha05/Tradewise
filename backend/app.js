import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import tradingRoutes from './routes/tradingRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.send('TradeWise API is running...');
});

// Routes will be added here
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradingRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alerts', alertRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;

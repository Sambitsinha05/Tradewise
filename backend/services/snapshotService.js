import cron from 'node-cron';
import User from '../models/userModel.js';
import Portfolio from '../models/portfolioModel.js';
import PortfolioSnapshot from '../models/portfolioSnapshotModel.js';
import { getQuote } from './marketDataService.js';
import { generatePortfolioAnalytics } from './analyticsService.js';

export const generateDailySnapshots = async () => {
  console.log('Running daily portfolio snapshot job...');
  try {
    const users = await User.find({});

    // Set today's date and normalize to midnight to avoid duplicate snapshots per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      const portfolio = await Portfolio.findOne({ user: user._id });
      if (!portfolio) continue; // Skip users without a portfolio

      let investedValue = 0;
      const snapshotHoldings = [];

      // Calculate current value of all holdings
      for (const holding of portfolio.holdings) {
        try {
          const quote = await getQuote(holding.symbol);
          const currentPrice = quote.currentPrice;
          investedValue += holding.quantity * currentPrice;

          snapshotHoldings.push({
            symbol: holding.symbol,
            quantity: holding.quantity,
            averageCost: holding.averageCost,
            currentPrice,
          });
        } catch (error) {
          console.error(`Failed to fetch quote for ${holding.symbol} during snapshot:`, error.message);
          // Fallback to average cost if API fails to prevent crashing the snapshot job
          investedValue += holding.quantity * holding.averageCost;
          snapshotHoldings.push({
            symbol: holding.symbol,
            quantity: holding.quantity,
            averageCost: holding.averageCost,
            currentPrice: holding.averageCost,
          });
        }
      }

      const totalValue = investedValue + user.virtualBalance;

      // Generate Health Score for the snapshot
      let healthScore = null;
      try {
        const analytics = await generatePortfolioAnalytics(user._id);
        healthScore = analytics.healthScore;
        
        // Update the portfolio's health score in real time as well
        portfolio.healthScore.score = healthScore;
        portfolio.healthScore.lastCalculated = new Date();
        await portfolio.save();
      } catch (err) {
        console.error(`Failed to generate analytics for user ${user._id} during snapshot`);
      }

      // Upsert the snapshot for today
      await PortfolioSnapshot.findOneAndUpdate(
        { user: user._id, date: today },
        {
          totalValue,
          cashBalance: user.virtualBalance,
          investedValue,
          holdings: snapshotHoldings,
          realizedPnL: portfolio.totalRealizedPnL,
          healthScore,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    console.log('Daily portfolio snapshot job completed successfully.');
  } catch (error) {
    console.error('Error in daily portfolio snapshot job:', error);
  }
};

// Schedule job to run at 16:30 (4:30 PM) every weekday (Monday-Friday) after US Market Close
export const startSnapshotCron = () => {
  cron.schedule('30 16 * * 1-5', () => {
    generateDailySnapshots();
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });
  console.log('Portfolio Snapshot Cron Job Scheduled (4:30 PM EST M-F).');
};

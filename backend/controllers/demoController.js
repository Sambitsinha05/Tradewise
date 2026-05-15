import User from '../models/userModel.js';
import Portfolio from '../models/portfolioModel.js';
import Transaction from '../models/transactionModel.js';
import Watchlist from '../models/watchlistModel.js';
import InventoryLot from '../models/inventoryModel.js';

/**
 * Setup a professional demo portfolio for the user
 */
export const setupDemoPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Reset Balance to $100k
    await User.findByIdAndUpdate(userId, { virtualBalance: 100000 });

    // 2. Clear existing data
    await Portfolio.findOneAndDelete({ user: userId });
    await Transaction.deleteMany({ user: userId });
    await Watchlist.findOneAndDelete({ user: userId });
    await InventoryLot.deleteMany({ userId });

    // 3. Create New Portfolio with Blue Chip Assets
    const demoHoldings = [
      { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, averageCost: 175.50, sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 15, averageCost: 850.20, sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 30, averageCost: 165.40, sector: 'Consumer Cyclical' },
      { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, averageCost: 62000.00, sector: 'Crypto' },
      { symbol: 'SPY', name: 'S&P 500 ETF', quantity: 20, averageCost: 510.00, sector: 'ETF' }
    ];

    const portfolio = new Portfolio({
      user: userId,
      holdings: demoHoldings,
      totalRealizedPnL: 540.20 // Some mock realized gains
    });
    await portfolio.save();

    // 4. Seed Transaction History & Inventory Lots
    for (const h of demoHoldings) {
      // Create BUY transaction
      const tx = new Transaction({
        user: userId,
        symbol: h.symbol,
        type: 'BUY',
        quantity: h.quantity,
        price: h.averageCost,
        totalAmount: h.quantity * h.averageCost,
        sector: h.sector,
        status: 'FILLED'
      });
      await tx.save();

      // Create Inventory Lot for FIFO matching
      const lot = new InventoryLot({
        userId,
        symbol: h.symbol,
        quantityBought: h.quantity,
        quantityRemaining: h.quantity,
        buyPrice: h.averageCost,
        transactionId: tx._id
      });
      await lot.save();
    }

    // 5. Seed Watchlist
    const watchlist = new Watchlist({
      user: userId,
      symbols: ['MSFT', 'GOOGL', 'ETH', 'AMD', 'META'].map(s => ({ symbol: s }))
    });
    await watchlist.save();

    res.json({ message: 'Demo portfolio environment initialized successfully', portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

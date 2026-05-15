import Transaction from '../models/transactionModel.js';

/**
 * Get all transactions for the current user
 */
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get transaction summary/stats
 */
export const getTransactionStats = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const stats = {
      totalTrades: transactions.length,
      buys: transactions.filter(t => t.type === 'BUY').length,
      sells: transactions.filter(t => t.type === 'SELL').length,
      totalVolume: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
      totalRealizedPnL: transactions.reduce((sum, t) => sum + (t.realizedPnL || 0), 0),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

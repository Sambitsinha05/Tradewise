import mongoose from 'mongoose';

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalValue: {
      type: Number,
      required: true, // Cash + Invested Value on this day
    },
    cashBalance: {
      type: Number,
      required: true, // The virtualBalance on this day
    },
    investedValue: {
      type: Number,
      required: true, // Market value of all holdings on this day
    },
    holdings: [
      {
        symbol: String,
        quantity: Number,
        averageCost: Number,
        currentPrice: Number,
      }
    ],
    realizedPnL: {
      type: Number,
      required: true,
    },
    healthScore: {
      type: Number, // Tracking if portfolio score improved or worsened
    }
  },
  {
    timestamps: true,
  }
);

// Ensure only one snapshot per user per day to avoid bloating the DB
portfolioSnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

const PortfolioSnapshot = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
export default PortfolioSnapshot;

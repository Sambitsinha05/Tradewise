import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  name: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  averageCost: {
    type: Number,
    required: true,
  },
  sector: {
    type: String,
    default: 'Unknown',
  },
  assetClass: {
    type: String,
    default: 'Equity', // could be Equity, ETF, Crypto
  }
});

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // One portfolio per user
    },
    holdings: [holdingSchema],
    totalRealizedPnL: {
      type: Number,
      default: 0,
    },
    // For Advanced Analytics & Beginner Insights
    healthScore: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      diversification: { type: Number, default: 0 },
      volatility: { type: Number, default: 0 },
      lastCalculated: { type: Date },
      recommendations: [{ type: String }],
    },
    riskMetrics: {
      category: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Uncalculated'],
        default: 'Uncalculated',
      },
      concentrationRiskSymbol: { type: String }, // Which stock is too highly concentrated
      concentrationRiskSector: { type: String }, // Which sector is too highly concentrated
    },
  },
  {
    timestamps: true,
  }
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;

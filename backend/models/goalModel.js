import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true, // e.g., "Buy a Car", "Retirement"
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 100,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    monthlyContributionNeeded: {
      type: Number, // Computed automatically
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACHIEVED', 'FAILED'],
      default: 'ACTIVE',
    },
    linkedPortfolioPercentage: {
      type: Number, // What % of the portfolio is dedicated to this goal?
      default: 100,
    }
  },
  {
    timestamps: true,
  }
);

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;

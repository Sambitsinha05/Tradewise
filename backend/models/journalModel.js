import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction', // Links back to the specific trade
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    tradeType: {
      type: String,
      enum: ['BUY', 'SELL', 'WATCHING'],
    },
    emotionalState: {
      type: String,
      enum: ['CONFIDENT', 'ANXIOUS', 'NEUTRAL', 'FOMO', 'PANIC'],
      default: 'NEUTRAL',
    },
    confidenceLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    strategy: {
      type: String, // e.g., "Momentum", "Value", "Breakout"
      default: 'General',
    },
    reasoning: {
      type: String,
      required: true,
    },
    mistakes: [{
      type: String, // e.g., "Traded against trend", "Revenge trading", "Position size too large"
    }],
    lessonsLearned: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;

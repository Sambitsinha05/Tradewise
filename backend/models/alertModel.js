import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    alertType: {
      type: String,
      enum: ['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_MOVE', 'VOLATILITY'],
      default: 'PRICE_ABOVE',
    },
    targetPrice: {
      type: Number,
    },
    condition: {
      type: String, // '>', '<', etc.
    },
    lastTriggered: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup
alertSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

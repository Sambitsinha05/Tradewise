import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['BUY', 'SELL'],
    },
    quantity: {
      type: Number,
      required: true,
    },
    remainingQuantity: {
      type: Number,
      default: 0, // Used for FIFO tracking on BUY trades
    },
    price: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    realizedPnL: {
      type: Number,
      default: 0, // Only set on SELL trades
    },
    sector: {
      type: String,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['FILLED', 'PENDING', 'CANCELLED', 'COMPLETED'],
      default: 'FILLED',
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // One watchlist per user (can expand to multiple later if needed)
    },
    symbols: [
      {
        symbol: { type: String, required: true, uppercase: true },
        addedAt: { type: Date, default: Date.now }
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;

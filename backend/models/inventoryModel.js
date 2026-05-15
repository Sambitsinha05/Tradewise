import mongoose from 'mongoose';

const inventoryLotSchema = new mongoose.Schema(
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
    quantityBought: {
      type: Number,
      required: true,
    },
    quantityRemaining: {
      type: Number,
      required: true,
      default: function() {
        return this.quantityBought;
      },
    },
    buyPrice: {
      type: Number,
      required: true,
    },
    boughtAt: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
    }
  },
  {
    timestamps: true,
  }
);

// Index for fast FIFO lookups
inventoryLotSchema.index({ userId: 1, symbol: 1, boughtAt: 1 });
inventoryLotSchema.index({ quantityRemaining: 1 });

const InventoryLot = mongoose.model('InventoryLot', inventoryLotSchema);

export default InventoryLot;

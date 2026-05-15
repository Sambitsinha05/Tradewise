import User from '../models/userModel.js';
import Portfolio from '../models/portfolioModel.js';
import Transaction from '../models/transactionModel.js';
import InventoryLot from '../models/inventoryModel.js';

/**
 * Execute a BUY trade
 */
export const executeBuy = async (userId, symbol, quantity, currentPrice, name, sector) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const totalCost = quantity * currentPrice;

    if (user.virtualBalance < totalCost) {
      throw new Error('Insufficient virtual balance');
    }

    // 1. Deduct balance
    user.virtualBalance -= totalCost;
    await user.save();

    // 2. Record Transaction
    const transaction = new Transaction({
      user: userId,
      symbol,
      sector: sector || 'General',
      type: 'BUY',
      quantity,
      price: currentPrice,
      totalAmount: totalCost,
    });
    await transaction.save();

    // 3. Create Inventory Lot for FIFO
    const lot = new InventoryLot({
      userId,
      symbol,
      quantityBought: quantity,
      quantityRemaining: quantity,
      buyPrice: currentPrice,
      transactionId: transaction._id
    });
    await lot.save();

    // 4. Update Portfolio
    let portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) {
      portfolio = new Portfolio({ user: userId, holdings: [] });
    }

    const holdingIndex = portfolio.holdings.findIndex((h) => h.symbol === symbol);

    if (holdingIndex >= 0) {
      const holding = portfolio.holdings[holdingIndex];
      const oldTotalCost = holding.quantity * holding.averageCost;
      const newTotalCost = oldTotalCost + totalCost;
      const newQuantity = holding.quantity + quantity;
      
      holding.averageCost = newTotalCost / newQuantity;
      holding.quantity = newQuantity;
    } else {
      portfolio.holdings.push({
        symbol,
        name: name || symbol,
        quantity,
        averageCost: currentPrice,
        sector: sector || 'General',
      });
    }

    await portfolio.save();

    return { success: true, transaction, balance: user.virtualBalance, portfolio };
  } catch (error) {
    throw error;
  }
};

/**
 * Execute a SELL trade with FIFO Logic using InventoryLot
 */
export const executeSell = async (userId, symbol, sellQuantity, currentPrice) => {
  try {
    const portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) throw new Error('Portfolio not found');

    const holdingIndex = portfolio.holdings.findIndex((h) => h.symbol === symbol);
    if (holdingIndex < 0 || portfolio.holdings[holdingIndex].quantity < sellQuantity) {
      throw new Error('Insufficient shares available for sale');
    }

    // 1. FIFO Logic for PnL Calculation using Inventory Lots
    let remainingToSell = sellQuantity;
    let realizedPnL = 0;
    let totalBuyCost = 0;

    // Fetch all open buy lots, oldest first
    const lots = await InventoryLot.find({
      userId,
      symbol,
      quantityRemaining: { $gt: 0 },
    }).sort({ boughtAt: 1 });

    if (lots.length === 0) {
      // Emergency fallback for demo data: Create a synthetic lot if none exists but holding does
      console.warn(`[FIFO] No lots found for ${symbol}, creating synthetic lot from holding.`);
      const holding = portfolio.holdings[holdingIndex];
      const syntheticLot = new InventoryLot({
        userId,
        symbol,
        quantityBought: holding.quantity,
        quantityRemaining: holding.quantity,
        buyPrice: holding.averageCost,
      });
      await syntheticLot.save();
      lots.push(syntheticLot);
    }

    for (let lot of lots) {
      if (remainingToSell <= 0) break;

      const quantityFromThisLot = Math.min(lot.quantityRemaining, remainingToSell);
      
      const profitFromThisLot = (currentPrice - lot.buyPrice) * quantityFromThisLot;
      realizedPnL += profitFromThisLot;
      totalBuyCost += (lot.buyPrice * quantityFromThisLot);

      lot.quantityRemaining -= quantityFromThisLot;
      remainingToSell -= quantityFromThisLot;
      
      await lot.save();
    }

    if (remainingToSell > 0) {
      throw new Error(`FIFO mismatch: Only found ${sellQuantity - remainingToSell} traceable shares in inventory.`);
    }

    // 2. Record SELL Transaction
    const totalAmount = sellQuantity * currentPrice;
    const transaction = new Transaction({
      user: userId,
      symbol,
      sector: portfolio.holdings[holdingIndex].sector || 'General',
      type: 'SELL',
      quantity: sellQuantity,
      price: currentPrice,
      totalAmount,
      realizedPnL,
    });
    await transaction.save();

    // 3. Update User Balance
    const user = await User.findById(userId);
    user.virtualBalance += totalAmount;
    await user.save();

    // 4. Update Portfolio
    portfolio.totalRealizedPnL += realizedPnL;
    const holding = portfolio.holdings[holdingIndex];
    holding.quantity -= sellQuantity;

    if (holding.quantity <= 0) {
      portfolio.holdings.splice(holdingIndex, 1);
    }

    await portfolio.save();

    return { 
      success: true, 
      transaction, 
      balance: user.virtualBalance, 
      realizedPnL, 
      portfolio,
      averageExitPrice: currentPrice,
      realizedROI: (realizedPnL / totalBuyCost) * 100
    };
  } catch (error) {
    throw error;
  }
};

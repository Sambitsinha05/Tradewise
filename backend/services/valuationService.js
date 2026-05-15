import { getQuote } from './marketDataService.js';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';

/**
 * Calculates real-time valuation of a user's portfolio
 */
export const calculatePortfolioValuation = async (userId) => {
  const portfolio = await Portfolio.findOne({ user: userId });
  const user = await User.findById(userId).select('virtualBalance');

  if (!portfolio || portfolio.holdings.length === 0) {
    return {
      totalValue: user.virtualBalance,
      holdingsValue: 0,
      cash: user.virtualBalance,
      unrealizedPnL: 0,
      totalPnL: portfolio?.totalRealizedPnL || 0,
      returnPercentage: 0,
      holdings: []
    };
  }

  const holdingsWithLivePrice = await Promise.all(
    portfolio.holdings.map(async (holding) => {
      try {
        const quote = await getQuote(holding.symbol);
        const currentPrice = quote.currentPrice;
        const value = holding.quantity * currentPrice;
        const costBasis = holding.quantity * holding.averageCost;
        const unrealizedPnL = value - costBasis;
        const returnPercentage = (unrealizedPnL / costBasis) * 100;

        return {
          ...holding.toObject(),
          currentPrice,
          marketValue: value,
          unrealizedPnL,
          returnPercentage,
          percentOfPortfolio: 0, // Calculated below
          dayChange: quote.change,
          dayChangePercent: quote.percentChange
        };
      } catch (err) {
        console.error(`Error valuing ${holding.symbol}:`, err.message);
        return {
          ...holding.toObject(),
          currentPrice: holding.averageCost,
          marketValue: holding.quantity * holding.averageCost,
          unrealizedPnL: 0,
          returnPercentage: 0,
          percentOfPortfolio: 0
        };
      }
    })
  );

  const holdingsValue = holdingsWithLivePrice.reduce((sum, h) => sum + h.marketValue, 0);
  const totalValue = holdingsValue + user.virtualBalance;
  const totalUnrealizedPnL = holdingsWithLivePrice.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const totalPnL = totalUnrealizedPnL + portfolio.totalRealizedPnL;
  const totalCostBasis = portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.averageCost), 0);
  
  // Calculate allocation %
  const finalizedHoldings = holdingsWithLivePrice.map(h => ({
    ...h,
    percentOfPortfolio: (h.marketValue / totalValue) * 100
  }));

  // Growth Attribution
  const topContributor = finalizedHoldings.reduce((prev, current) => 
    (prev.unrealizedPnL > current.unrealizedPnL) ? prev : current
  , finalizedHoldings[0]);

  const largestDrag = finalizedHoldings.reduce((prev, current) => 
    (prev.unrealizedPnL < current.unrealizedPnL) ? prev : current
  , finalizedHoldings[0]);

  // Sector breakdown
  const sectorAlloc = finalizedHoldings.reduce((acc, h) => {
    acc[h.sector] = (acc[h.sector] || 0) + h.marketValue;
    return acc;
  }, {});

  // Intelligent insights
  const bestPerformer = finalizedHoldings.reduce((prev, current) => 
    (prev.returnPercentage > current.returnPercentage) ? prev : current
  , finalizedHoldings[0]);

  const worstPerformer = finalizedHoldings.reduce((prev, current) => 
    (prev.returnPercentage < current.returnPercentage) ? prev : current
  , finalizedHoldings[0]);

  // Momentum logic (Rule-based)
  const avgReturn = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) : 0;
  let momentum = 'STABLE';
  if (avgReturn > 0.05) momentum = 'BULLISH';
  if (avgReturn > 0.15) momentum = 'HYPER-GROWTH';
  if (avgReturn < -0.05) momentum = 'BEARISH';

  // Intelligence Insights
  const insights = {
    bestPerformer,
    worstPerformer,
    topContributor,
    largestDrag,
    momentum,
    growthEfficiency: Math.max(0, Math.min(100, 70 + (avgReturn * 100))), // Mock efficiency score
    sectorAllocation: sectorAlloc,
    milestones: [
      { id: 1, title: 'Institutional Start', date: portfolio.createdAt, icon: 'Flag' },
      totalValue > 5000 ? { id: 2, title: 'Crossed $5k', date: new Date(), icon: 'TrendingUp' } : null,
      totalPnL > 0 ? { id: 3, title: 'Net Profitable', date: new Date(), icon: 'Award' } : null
    ].filter(Boolean)
  };

  return {
    totalValue,
    holdingsValue,
    cash: user.virtualBalance,
    unrealizedPnL: totalUnrealizedPnL,
    realizedPnL: portfolio.totalRealizedPnL,
    totalPnL,
    totalReturnPercentage: totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0,
    totalCostBasis,
    holdings: finalizedHoldings,
    insights
  };
};

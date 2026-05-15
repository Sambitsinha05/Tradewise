import axios from 'axios';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import Transaction from '../models/transactionModel.js';

// ─── Utility ─────────────────────────────────────────────────────────────────
const safeDiv = (num, den, fallback = 0) => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return fallback;
  const r = num / den;
  return Number.isFinite(r) ? r : fallback;
};

const safeSqrt = (n) => (n >= 0 && Number.isFinite(n) ? Math.sqrt(n) : 0);

/**
 * Historical metrics from Alpha Vantage (or deterministic mock)
 */
export const calculateHistoricalMetrics = async (symbol) => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const isMock = !apiKey || apiKey === 'your_alpha_vantage_api_key';

  if (isMock) {
    const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const cagr = +(8 + (seed % 14)).toFixed(2);
    const volatility = +(12 + (seed % 18)).toFixed(2);
    const maxDrawdown = +(8 + (seed % 22)).toFixed(2);
    const sharpeRatio = +(safeDiv(cagr - 4.5, volatility)).toFixed(2);
    const sortinoRatio = +(sharpeRatio * 1.3).toFixed(2);
    const beta = +(0.7 + (seed % 60) / 100).toFixed(2);
    const alpha = +(safeDiv(cagr - 4.5 - beta * (10 - 4.5), 1)).toFixed(2);
    return {
      symbol, cagr, volatility, maxDrawdown,
      sharpeRatio, sortinoRatio, beta, alpha,
      period: '5Y', riskFreeRate: 4.5
    };
  }

  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: { function: 'TIME_SERIES_MONTHLY_ADJUSTED', symbol, apikey: apiKey },
    });
    const rawData = response.data['Monthly Adjusted Time Series'];
    if (!rawData) throw new Error('No data');

    const prices = Object.values(rawData).map(d => parseFloat(d['5. adjusted close'])).reverse();
    const years = prices.length / 12;
    const cagr = (Math.pow(safeDiv(prices[prices.length - 1], prices[0]), safeDiv(1, years)) - 1) * 100;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(safeDiv(prices[i] - prices[i - 1], prices[i - 1]));
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / returns.length;
    const downsideVariance = returns.filter(r => r < 0).reduce((a, r) => a + r * r, 0) / returns.length;
    const annualizedVol = safeSqrt(variance) * safeSqrt(12) * 100;
    const downsideVol = safeSqrt(downsideVariance) * safeSqrt(12) * 100;

    let peak = -Infinity, maxDrawdown = 0;
    prices.forEach(p => {
      if (p > peak) peak = p;
      const dd = safeDiv(peak - p, peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    const sharpeRatio = safeDiv(cagr - 4.5, annualizedVol);
    const sortinoRatio = safeDiv(cagr - 4.5, downsideVol);
    const beta = +(0.7 + Math.random() * 0.6).toFixed(2);
    const alpha = +(cagr - 4.5 - beta * 5.5).toFixed(2);

    return {
      symbol, period: `${Math.floor(years)}Y`, riskFreeRate: 4.5,
      cagr: +cagr.toFixed(2),
      volatility: +annualizedVol.toFixed(2),
      maxDrawdown: +maxDrawdown.toFixed(2),
      sharpeRatio: +sharpeRatio.toFixed(2),
      sortinoRatio: +sortinoRatio.toFixed(2),
      beta, alpha,
    };
  } catch {
    const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      symbol, cagr: +(8 + seed % 14).toFixed(2), volatility: +(12 + seed % 18).toFixed(2),
      maxDrawdown: +(8 + seed % 22).toFixed(2), sharpeRatio: +((seed % 14 + 8) / (12 + seed % 18) * 0.9).toFixed(2),
      sortinoRatio: +((seed % 14 + 8) / (12 + seed % 18) * 1.2).toFixed(2),
      beta: +(0.8 + seed % 40 / 100).toFixed(2), alpha: +(seed % 6).toFixed(2),
      period: '5Y', riskFreeRate: 4.5
    };
  }
};

/**
 * VaR (Value at Risk) — Parametric method at 95% confidence
 * VaR = portfolioValue * z * dailyVol * sqrt(horizon)
 */
const calculateVaR = (portfolioValue, dailyVolatility, horizon = 1, confidence = 0.95) => {
  const z = confidence === 0.99 ? 2.326 : 1.645; // 95% z-score
  return Math.abs(portfolioValue * z * (dailyVolatility / 100) * safeSqrt(horizon));
};

/**
 * Full portfolio analytics — health, allocation, quant metrics, AI insights
 */
export const generatePortfolioAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);
    const portfolio = await Portfolio.findOne({ user: userId });
    const transactions = await Transaction.find({ user: userId });

    if (!portfolio || portfolio.holdings.length === 0) {
      return {
        healthScore: 50,
        riskCategory: 'Unclassified',
        diversificationScore: 0,
        recommendations: ['Load a demo portfolio or make your first trade to unlock analytics.'],
        assetAllocation: [],
        sectorDiversification: [],
        historicalMetrics: { sharpeRatio: 0, sortinoRatio: 0, volatility: 0, maxDrawdown: 0, cagr: 0, alpha: 0, beta: 1, var95: 0 },
        insights: []
      };
    }

    const holdingsValue = portfolio.holdings.reduce((s, h) => s + h.quantity * h.averageCost, 0);
    const totalValue = holdingsValue + (user?.virtualBalance || 0);

    // ─── Allocation ───────────────────────────────────────────────────────────
    const assetAllocation = portfolio.holdings.map(h => ({
      symbol: h.symbol,
      value: h.quantity * h.averageCost,
      percentage: +safeDiv(h.quantity * h.averageCost, holdingsValue, 0) * 100,
    }));

    const sectorMap = {};
    portfolio.holdings.forEach(h => {
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + (h.quantity * h.averageCost);
    });
    const sectorDiversification = Object.entries(sectorMap).map(([sector, val]) => ({
      sector,
      value: val,
      percentage: +safeDiv(val, holdingsValue, 0) * 100,
    }));

    // ─── Concentration risk ───────────────────────────────────────────────────
    const maxConcentration = Math.max(...assetAllocation.map(a => a.percentage));
    const herfindahlIndex = assetAllocation.reduce((s, a) => s + Math.pow(a.percentage / 100, 2), 0);

    // ─── Quant metrics (blended mock + real logic) ────────────────────────────
    const avgVol = 15 + (userId.toString().charCodeAt(0) % 12);
    const avgSharpe = +(safeDiv(12 - 4.5, avgVol)).toFixed(2);
    const avgSortino = +(avgSharpe * 1.25).toFixed(2);
    const maxDrawdown = +(10 + userId.toString().charCodeAt(1) % 18).toFixed(2);
    const cagr = +(8 + userId.toString().charCodeAt(2) % 10).toFixed(2);
    const beta = +(0.85 + userId.toString().charCodeAt(3) % 35 / 100).toFixed(2);
    const alpha = +(cagr - 4.5 - beta * 5.5).toFixed(2);
    const var95 = +calculateVaR(holdingsValue, avgVol).toFixed(2);
    const var99 = +calculateVaR(holdingsValue, avgVol, 1, 0.99).toFixed(2);

    // ─── Health score ─────────────────────────────────────────────────────────
    const holdingCount = portfolio.holdings.length;
    const sectorCount = sectorDiversification.length;
    const concentrationPenalty = maxConcentration > 50 ? -20 : maxConcentration > 35 ? -10 : 0;
    const diversificationBonus = Math.min(holdingCount * 8 + sectorCount * 10, 50);
    const performanceBonus = avgSharpe > 1 ? 20 : avgSharpe > 0.5 ? 10 : 0;
    const healthScore = Math.min(100, Math.max(10, 40 + diversificationBonus + performanceBonus + concentrationPenalty));

    const riskCategory = herfindahlIndex > 0.4 ? 'Concentrated' : herfindahlIndex > 0.2 ? 'Moderate' : 'Diversified';

    // ─── Trading behavior ─────────────────────────────────────────────────────
    const sells = transactions.filter(t => t.type === 'SELL');
    const winRate = sells.length > 0
      ? +safeDiv(sells.filter(t => t.realizedPnL > 0).length, sells.length) * 100
      : null;

    // ─── AI-style rule-based recommendations ─────────────────────────────────
    const recommendations = [];
    if (maxConcentration > 50) recommendations.push(`⚠️ "${assetAllocation.sort((a, b) => b.percentage - a.percentage)[0]?.symbol}" accounts for ${maxConcentration.toFixed(0)}% of holdings. High concentration risk.`);
    if (sectorCount < 3) recommendations.push('📊 Portfolio is exposed to fewer than 3 sectors. Consider diversifying into defensive equities or ETFs.');
    if (user?.virtualBalance > holdingsValue * 0.4) recommendations.push('💰 High cash drag detected. Consider deploying capital to reduce opportunity cost.');
    if (avgSharpe < 0.5) recommendations.push('📉 Sharpe ratio below 0.5 indicates poor risk-adjusted returns. Reassess position sizing.');
    if (beta > 1.2) recommendations.push('⚡ Portfolio beta exceeds 1.2 — highly market-correlated. Add defensive assets to reduce systematic risk.');
    if (winRate !== null && winRate < 40) recommendations.push(`🔴 Win rate of ${winRate.toFixed(0)}% on closed trades. Review entry/exit strategy.`);
    if (holdingCount >= 5 && sectorCount >= 3 && avgSharpe > 0.8) recommendations.push('✅ Portfolio structure is well-diversified with strong risk-adjusted returns.');
    if (recommendations.length === 0) recommendations.push('✅ Portfolio analytics look healthy. Continue monitoring sector exposure regularly.');

    return {
      healthScore: Math.round(healthScore),
      riskCategory,
      diversificationScore: Math.round(diversificationBonus * 2),
      assetAllocation,
      sectorDiversification,
      winRate,
      recommendations,
      historicalMetrics: {
        sharpeRatio: avgSharpe,
        sortinoRatio: avgSortino,
        volatility: avgVol,
        maxDrawdown,
        cagr,
        alpha,
        beta,
        var95,
        var99,
      },
    };
  } catch (error) {
    console.error('Analytics Engine Error:', error);
    return {
      healthScore: 0,
      riskCategory: 'Error',
      recommendations: ['Failed to generate analytics report. Please try again.'],
      historicalMetrics: { sharpeRatio: 0, sortinoRatio: 0, volatility: 0, maxDrawdown: 0, cagr: 0, alpha: 0, beta: 1, var95: 0, var99: 0 },
    };
  }
};

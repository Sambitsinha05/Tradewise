import Journal from '../models/journalModel.js';
import Transaction from '../models/transactionModel.js';

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
export const createJournalEntry = async (req, res, next) => {
  try {
    const { transactionId, symbol, tradeType, emotionalState, reasoning, mistakes, lessonsLearned, confidenceLevel, strategy } = req.body;
    const userId = req.user._id;

    if (!symbol || !reasoning) {
      res.status(400);
      throw new Error('Symbol and reasoning are required');
    }

    const entry = new Journal({
      user: userId,
      transactionId,
      symbol: symbol.toUpperCase(),
      tradeType,
      emotionalState,
      confidenceLevel,
      strategy,
      reasoning,
      mistakes,
      lessonsLearned,
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all journal entries
// @route   GET /api/journal
// @access  Private
export const getJournalEntries = async (req, res, next) => {
  try {
    const entries = await Journal.find({ user: req.user._id })
      .populate('transactionId')
      .sort({ createdAt: -1 });

    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

// @desc    Get journal behavior analytics
// @route   GET /api/journal/analytics
// @access  Private
export const getJournalAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // We want to find how emotional states correlate with realized PnL.
    // 1. Fetch all journal entries that have an associated transaction
    const journalEntries = await Journal.find({ user: userId, transactionId: { $ne: null } })
      .populate('transactionId');

    const emotionPerformance = {};
    const strategyPerformance = {};
    const sectorPerformance = {};
    const symbolPerformance = {};
    let mostProfitableSymbol = { symbol: '', pnl: -Infinity };

    journalEntries.forEach(entry => {
      const tx = entry.transactionId;
      if (!tx || tx.type !== 'SELL') return; // Only calculate PnL on sells

      const pnl = tx.realizedPnL || 0;
      const emotion = entry.emotionalState || 'NEUTRAL';
      const strategy = entry.strategy || 'General';
      const sector = tx.sector || 'General';
      const symbol = entry.symbol;

      // Track by emotion
      if (!emotionPerformance[emotion]) {
        emotionPerformance[emotion] = { totalPnL: 0, tradeCount: 0 };
      }
      emotionPerformance[emotion].totalPnL += pnl;
      emotionPerformance[emotion].tradeCount += 1;

      // Track by strategy
      if (!strategyPerformance[strategy]) {
        strategyPerformance[strategy] = { totalPnL: 0, tradeCount: 0 };
      }
      strategyPerformance[strategy].totalPnL += pnl;
      strategyPerformance[strategy].tradeCount += 1;

      // Track by sector
      if (!sectorPerformance[sector]) {
        sectorPerformance[sector] = { totalPnL: 0, tradeCount: 0 };
      }
      sectorPerformance[sector].totalPnL += pnl;
      sectorPerformance[sector].tradeCount += 1;

      // Track by symbol
      if (!symbolPerformance[symbol]) {
        symbolPerformance[symbol] = 0;
      }
      symbolPerformance[symbol] += pnl;

      if (symbolPerformance[symbol] > mostProfitableSymbol.pnl) {
        mostProfitableSymbol = { symbol, pnl: symbolPerformance[symbol] };
      }
    });

    // Determine best and worst performers
    const getBestKey = (obj) => Object.keys(obj).sort((a, b) => obj[b].totalPnL - obj[a].totalPnL)[0];
    const getWorstKey = (obj) => Object.keys(obj).sort((a, b) => obj[a].totalPnL - obj[b].totalPnL)[0];

    const bestEmotion = getBestKey(emotionPerformance);
    const worstEmotion = getWorstKey(emotionPerformance);
    const bestStrategy = getBestKey(strategyPerformance);
    const bestSector = getBestKey(sectorPerformance);

    res.status(200).json({
      emotionPerformance,
      strategyPerformance,
      sectorPerformance,
      insights: {
        bestEmotion: bestEmotion || 'N/A',
        worstEmotion: worstEmotion || 'N/A',
        bestStrategy: bestStrategy || 'N/A',
        bestSector: bestSector || 'N/A',
        mostProfitableSymbol: mostProfitableSymbol.symbol || 'N/A',
        message: `You are most profitable using the ${bestStrategy || 'General'} strategy in the ${bestSector || 'General'} sector with a ${bestEmotion || 'Neutral'} mindset. Avoid trading when feeling ${worstEmotion || 'Anxious'}.`
      }
    });

  } catch (error) {
    next(error);
  }
};

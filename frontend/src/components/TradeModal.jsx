import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, BarChart2, BookOpen, PlusCircle, Activity, ShieldCheck, IndianRupee } from 'lucide-react';
import { api, useAuthStore } from '../store/authStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useNotificationStore } from '../store/notificationStore';

const TradeModal = ({ isOpen, onClose, stock, onSuccess, initialType = 'BUY' }) => {
  const [type, setType] = useState(initialType); // 'BUY' or 'SELL'
  const [tradeMode, setTradeMode] = useState('SHARES'); // 'SHARES' or 'AMOUNT'
  const [quantity, setQuantity] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const { holdings, syncPortfolio, getHolding, fetchValuation } = usePortfolioStore();
  const { format, formatNative, formatDual, currency, rates } = useCurrencyStore();
  const { addToast, fetchNotifications } = useNotificationStore();
  const [executionState, setExecutionState] = useState('IDLE');
  const [orderMode, setOrderMode] = useState('MARKET'); // 'MARKET' or 'LIMIT'
  const [limitPrice, setLimitPrice] = useState('');

  const [isJournaling, setIsJournaling] = useState(false);
  const [journalData, setJournalData] = useState({
    emotionalState: 'NEUTRAL',
    confidenceLevel: 3,
    strategy: 'General',
    reasoning: ''
  });

  // Sync type when modal opens with a specific type
  useEffect(() => {
    if (isOpen) {
      setType(initialType || 'BUY');
      setQuantity('');
      setAmountInput('');
    }
  }, [isOpen, initialType]);

  const holding = stock ? getHolding(stock.symbol) : null;

  if (!isOpen || !stock) return null;

  // Conversion logic for "Amount" mode
  const calculateQuantityFromAmount = (amt) => {
    if (!amt || isNaN(amt)) return 0;
    const rate = rates[currency] || 1;
    const amountInUSD = amt / rate;
    return amountInUSD / stock.currentPrice;
  };

  const calculateAmountFromQuantity = (qty) => {
    if (!qty || isNaN(qty)) return 0;
    const costInUSD = qty * stock.currentPrice;
    const rate = rates[currency] || 1;
    return costInUSD * rate;
  };

  const effectiveQuantity = tradeMode === 'SHARES' ? Number(quantity) : calculateQuantityFromAmount(Number(amountInput));
  const totalCostUSD = effectiveQuantity * stock.currentPrice;

  // Smart Insights Calculations
  const portfolioValue = holdings.reduce((acc, h) => acc + (h.quantity * (h.averageCost || 0)), 0) + (user?.virtualBalance || 0);
  const currentConcentration = holding ? ((holding.quantity * stock.currentPrice) / portfolioValue) * 100 : 0;
  const targetConcentration = (((holding?.quantity || 0) + effectiveQuantity) * stock.currentPrice / (portfolioValue + (type === 'BUY' ? 0 : 0))) * 100;
  
  const isHighVolatility = Math.abs(stock.percentChange || 0) > 5;
  const isHighConcentration = targetConcentration > 30;

  const handleTrade = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Sell Confirmation Requirement
    if (type === 'SELL' && executionState === 'IDLE') {
        setExecutionState('CONFIRMATION');
        setIsLoading(false);
        return;
    }

    setExecutionState('PROCESSING');
    
    // Slippage Simulation
    const slippage = (Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1); 
    const executionPrice = stock.currentPrice * (1 + slippage);

    const timeoutId = setTimeout(() => {
      if (executionState === 'PROCESSING') {
        setExecutionState('IDLE');
        setIsLoading(false);
        setError('Execution timed out. Please check your internet connection.');
      }
    }, 10000);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const endpoint = type === 'BUY' ? '/trade/buy' : '/trade/sell';
      const tradeRes = await api.post(endpoint, {
        symbol: stock.symbol,
        quantity: effectiveQuantity,
        currentPrice: executionPrice,
        sector: stock.sector || 'General'
      });
      
      if (isJournaling || journalData.reasoning || type === 'SELL') {
        const autoReasoning = journalData.reasoning || (type === 'SELL' 
          ? `Closed position for ${effectiveQuantity.toFixed(4)} shares of ${stock.symbol}. Realized P/L: ${profitLoss >= 0 ? '+' : ''}${formatNative(profitLoss)}.`
          : `Initiated buy of ${effectiveQuantity.toFixed(4)} shares of ${stock.symbol} at execution price ${formatNative(executionPrice)}.`);
        
        await api.post('/journal', {
          ...journalData,
          reasoning: autoReasoning,
          transactionId: tradeRes.data.transaction?._id,
          symbol: stock.symbol,
          tradeType: type
        });
      }

      clearTimeout(timeoutId);
      setExecutionState('SUCCESS');

      await syncPortfolio();
      await fetchNotifications();
      await fetchValuation();

      if (onSuccess) onSuccess();
      addToast(
        'TRADE_EXECUTED',
        `${type} Order Filled`,
        type === 'SELL'
          ? `${effectiveQuantity.toFixed(4)} × ${stock.symbol} sold. Realized P/L: ${profitLoss >= 0 ? '+' : ''}${formatNative(profitLoss)}`
          : `${effectiveQuantity.toFixed(4)} × ${stock.symbol} @ ${formatNative(executionPrice)} — Total ${formatNative(effectiveQuantity * executionPrice)}`
      );
      
      setTimeout(() => {
        setExecutionState('IDLE');
        setQuantity('');
        setAmountInput('');
        setIsJournaling(false);
        onClose();
      }, 3000);

    } catch (err) {
      clearTimeout(timeoutId);
      setError(err.response?.data?.message || 'Transaction failed');
      setExecutionState('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const avgCost = holding?.averageCost || 0;
  const profitLoss = (stock.currentPrice - avgCost) * effectiveQuantity;
  const profitLossPercent = avgCost > 0 ? ((stock.currentPrice - avgCost) / avgCost) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Simulated Execution Overlay */}
          <AnimatePresence>
            {executionState !== 'IDLE' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
              >
                {executionState === 'PROCESSING' ? (
                  <>
                    <div className="relative w-24 h-24 mb-8">
                      <motion.div 
                        animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Activity className="text-primary" size={32} />
                      </motion.div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Securing Best Price</h3>
                    <p className="text-textMuted font-bold text-xs uppercase tracking-widest animate-pulse">Routing through institutional pools...</p>
                  </>
                ) : executionState === 'CONFIRMATION' ? (
                   <div className="w-full max-w-sm glass p-8 rounded-[40px] border border-white/10 space-y-8 shadow-2xl">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Confirm {type} Order</h3>
                            <p className="text-textMuted text-xs font-bold uppercase tracking-widest">Fractional execution enabled</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">Asset</span>
                                <span className="text-white font-black">{stock.symbol}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">Quantity</span>
                                <span className="text-white font-black">{effectiveQuantity.toFixed(6)} Shares</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">Price</span>
                                <span className="text-white font-black">{formatNative(stock.currentPrice)}</span>
                            </div>
                            {type === 'SELL' && (
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-success/10 border border-success/20">
                                    <span className="text-[10px] font-black text-success uppercase tracking-widest">Estimated Return</span>
                                    <span className="text-success font-black">{profitLoss >= 0 ? '+' : ''}{formatNative(profitLoss)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setExecutionState('IDLE')}
                                className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleTrade}
                                className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl ${type === 'BUY' ? 'bg-success shadow-success/20' : 'bg-danger shadow-danger/20'}`}
                            >
                                Confirm
                            </button>
                        </div>
                   </div>
                ) : (
                  <>
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-success mb-8 shadow-2xl shadow-success/20"
                    >
                      <ShieldCheck size={48} />
                    </motion.div>
                    <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Order Filled</h3>
                    <p className="text-success font-black text-xs uppercase tracking-widest">Fractional shares credited</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent sticky top-0 bg-[#0f172a] z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-lg uppercase tracking-tighter">Fractional Trading Enabled</span>
                <h3 className="text-2xl font-black text-white tracking-tighter">{stock.symbol}</h3>
              </div>
              <p className="text-sm font-medium text-textMuted flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-black uppercase text-primary border border-white/5">
                  <Activity size={10} /> Live
                </span>
                Price: 
                <span className="text-white font-bold">{formatNative(stock.currentPrice)}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-3 text-textMuted hover:text-white rounded-2xl hover:bg-white/5 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            {/* Smart Order Insights */}
            <AnimatePresence>
              {(isHighVolatility || isHighConcentration) && type === 'BUY' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="mb-6 p-4 rounded-2xl bg-warning/10 border border-warning/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-warning font-black text-[10px] uppercase tracking-widest">
                    <Activity size={14} /> Smart Order Insights
                  </div>
                  {isHighVolatility && (
                    <p className="text-xs text-white/80 font-medium">
                      ⚠️ <span className="text-warning font-bold">High Volatility Detected:</span> This asset moved {stock.percentChange?.toFixed(2)}% today.
                    </p>
                  )}
                  {isHighConcentration && (
                    <p className="text-xs text-white/80 font-medium">
                      ⚠️ <span className="text-warning font-bold">Concentration Risk:</span> Exposure will increase to {targetConcentration.toFixed(1)}%.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex p-1.5 bg-black/40 rounded-2xl mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => { setType('BUY'); setError(''); }}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  type === 'BUY' ? 'bg-success text-white shadow-xl shadow-success/20' : 'text-textMuted hover:text-white'
                }`}
              >
                <TrendingUp size={18} /> BUY
              </button>
              <button
                type="button"
                onClick={() => { setType('SELL'); setError(''); }}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  type === 'SELL' ? 'bg-danger text-white shadow-xl shadow-danger/20' : 'text-textMuted hover:text-white'
                }`}
              >
                <TrendingDown size={18} /> SELL
              </button>
            </div>

            {/* Trade Mode Toggle */}
            <div className="flex gap-4 mb-8">
              {[
                { id: 'SHARES', label: 'BUY BY SHARES', icon: <PieChart size={12} /> },
                { id: 'AMOUNT', label: `BUY BY AMOUNT (${currency})`, icon: currency === 'INR' ? <IndianRupee size={12} /> : <DollarSign size={12} /> }
              ].map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setTradeMode(mode.id);
                    setQuantity('');
                    setAmountInput('');
                  }}
                  className={`flex-1 py-2.5 text-[9px] font-black rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    tradeMode === mode.id 
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5' 
                      : 'border-white/5 text-textMuted hover:border-white/20'
                  }`}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm font-bold flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleTrade} className="space-y-6">
              <div className="relative">
                <label className="block text-xs font-black text-textMuted mb-3 uppercase tracking-widest">
                  {tradeMode === 'SHARES' ? 'Order Quantity' : `Investment Amount (${currency})`}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    value={tradeMode === 'SHARES' ? quantity : amountInput}
                    onChange={(e) => tradeMode === 'SHARES' ? setQuantity(e.target.value) : setAmountInput(e.target.value)}
                    className="w-full px-6 py-5 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-primary text-white text-3xl font-black tracking-tighter placeholder:text-white/10 transition-all"
                    placeholder="0.00"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-textMuted font-bold text-sm tracking-widest uppercase pointer-events-none">
                    {tradeMode === 'SHARES' ? 'Shares' : currency}
                  </div>
                </div>
                {tradeMode === 'AMOUNT' && Number(amountInput) > 0 && (
                  <p className="mt-2 text-[10px] font-black text-primary/80 uppercase tracking-widest">
                    You will receive ≈ {effectiveQuantity.toFixed(6)} Shares
                  </p>
                )}
              </div>

              {type === 'SELL' && holding && (
                <div className="flex items-center gap-2 flex-wrap">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const qty = holding.quantity * (pct / 100);
                        if (tradeMode === 'SHARES') setQuantity(qty.toFixed(6));
                        else setAmountInput(calculateAmountFromQuantity(qty).toFixed(2));
                      }}
                      className="flex-1 py-2 bg-white/5 hover:bg-primary/20 text-textMuted hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              <div className="p-6 rounded-3xl bg-white/5 space-y-6 border border-white/5 backdrop-blur-xl">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-textMuted font-bold uppercase tracking-tighter">
                    <BarChart2 size={16} /> {type === 'BUY' ? 'Total Cost' : 'Proceeds'}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-white font-black text-lg">{formatDual(totalCostUSD).converted}</span>
                  </div>
                </div>
                
                <div className="h-px bg-white/5 w-full" />

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
                    <PieChart size={12} /> Portfolio Impact Preview
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <p className="text-[9px] text-textMuted font-bold uppercase mb-1">Concentration</p>
                      <p className="text-xs text-white font-black">
                        {currentConcentration.toFixed(1)}% → {targetConcentration.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <p className="text-[9px] text-textMuted font-bold uppercase mb-1">Shares to {type === 'BUY' ? 'Acquire' : 'Sell'}</p>
                      <p className="text-xs text-white font-black">
                        {effectiveQuantity.toFixed(4)} UNITS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-textMuted font-bold uppercase tracking-tighter">
                    <Wallet size={16} /> Purchasing Power
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-primary font-black">
                      {formatDual(user?.virtualBalance || 0).converted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journaling Toggle */}
              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsJournaling(!isJournaling)}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-textMuted hover:text-white transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" />
                    {isJournaling ? 'DISCARD BEHAVIORAL NOTES' : 'ADD TRADE REASONING (RECOMMENDED)'}
                  </span>
                  <PlusCircle size={16} className={`transition-transform ${isJournaling ? 'rotate-45' : ''}`} />
                </button>

                <AnimatePresence>
                  {isJournaling && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-textMuted mb-2 uppercase tracking-widest">Mindset</label>
                            <select
                              value={journalData.emotionalState}
                              onChange={(e) => setJournalData({ ...journalData, emotionalState: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-primary"
                            >
                              <option value="NEUTRAL">Neutral</option>
                              <option value="CONFIDENT">Confident</option>
                              <option value="ANXIOUS">Anxious</option>
                              <option value="FOMO">FOMO</option>
                              <option value="PANIC">Panic</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-textMuted mb-2 uppercase tracking-widest">Confidence (1-5)</label>
                            <input
                              type="range" min="1" max="5"
                              value={journalData.confidenceLevel}
                              onChange={(e) => setJournalData({ ...journalData, confidenceLevel: Number(e.target.value) })}
                              className="w-full accent-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <textarea
                            value={journalData.reasoning}
                            onChange={(e) => setJournalData({ ...journalData, reasoning: e.target.value })}
                            placeholder="Reasoning: e.g. Technical breakout at support level..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white font-medium outline-none focus:border-primary h-24 resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={isLoading || effectiveQuantity <= 0 || (type === 'SELL' && (!holding || effectiveQuantity > holding.quantity))}
                className={`w-full py-5 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl transform active:scale-95 ${
                  type === 'BUY' 
                    ? 'bg-success hover:bg-success/90 text-white shadow-success/20' 
                    : 'bg-danger hover:bg-danger/90 text-white shadow-danger/20'
                }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>CONFIRM {type} ORDER</>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TradeModal;

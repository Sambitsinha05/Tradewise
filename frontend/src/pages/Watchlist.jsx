import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Bell, Trash2, ArrowUpRight, ArrowDownRight, 
  Activity, DollarSign, TrendingUp, TrendingDown, Clock,
  ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useSocketStore } from '../store/socketStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { api } from '../store/authStore';
import TradeModal from '../components/TradeModal';
import { WatchlistSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

const Watchlist = () => {
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  const { liveWatchlist } = useSocketStore();
  const { 
    watchlist, fetchWatchlist, addAsset, removeAsset, toggleAlert, 
    alerts, isLoading, isActionLoading 
  } = useWatchlistStore();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Advanced Alert Config Modal
  const [activeAlertItem, setActiveAlertItem] = useState(null);
  const [alertTarget, setAlertTarget] = useState('');
  const [alertCondition, setAlertCondition] = useState('>');

  // Trade Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/market/search?query=${query}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStock = (symbol) => {
    addAsset(symbol);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuickToggle = async (symbol, currentPrice) => {
    await toggleAlert(symbol, currentPrice);
  };

  const handleAdvancedAlert = async (e) => {
    e.preventDefault();
    if (!activeAlertItem) return;
    
    try {
      await api.post('/alerts', {
        symbol: activeAlertItem.symbol,
        targetPrice: Number(alertTarget),
        condition: alertCondition,
        alertType: alertCondition === '>' ? 'PRICE_ABOVE' : 'PRICE_BELOW',
        enabled: true
      });
      fetchWatchlist();
      setActiveAlertItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openTrade = (symbol, price) => {
    setSelectedStock({ symbol, currentPrice: price || 150.00 });
    setIsTradeModalOpen(true);
  };

  if (isLoading && !watchlist) {
    return <WatchlistSkeleton />;
  }

  const items = watchlist?.items || [];
  const analytics = watchlist?.analytics || { greenCount: 0, redCount: 0, averageChangePercent: 0 };
  const activeAlertsCount = alerts.filter(a => a.enabled).length;

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4">
            Live Pulse <Activity className="text-primary animate-pulse" />
          </h1>
          <p className="text-textMuted font-medium">Real-time surveillance of your prioritized global assets.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3 bg-white/[0.02]">
              <div className="w-2 h-2 rounded-full bg-success animate-ping" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Market Stream Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Surveillance List */}
        <div className="lg:col-span-9 space-y-6">
          <div className="glass p-8 rounded-[40px] border border-white/5 bg-white/[0.01]">
            
            {/* Search and Discovery */}
            <div className="relative mb-10" ref={searchRef}>
               <div className="flex items-center bg-black/40 border border-white/10 rounded-[24px] px-6 py-4 focus-within:border-primary transition-all group">
                  <Search size={20} className="text-textMuted mr-4 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Add Asset to Surveillance (e.g. AAPL, BTC, TSLA)..."
                    className="bg-transparent border-none outline-none text-base text-white w-full placeholder:text-textMuted/40 font-black uppercase tracking-tight"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
               </div>

               <AnimatePresence>
                 {searchQuery.length >= 2 && searchResults.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                     className="absolute top-full left-0 right-0 mt-3 glass border border-white/10 rounded-[32px] shadow-2xl z-[200] overflow-hidden max-h-[400px] backdrop-blur-3xl"
                   >
                     <div className="p-4 space-y-1">
                       {searchResults.map((stock) => (
                         <button
                           key={stock.symbol}
                           onClick={() => handleAddStock(stock.symbol)}
                           className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all text-left group"
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center font-black text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                                {stock.symbol[0]}
                              </div>
                              <div>
                                 <span className="font-black text-white text-lg block tracking-tighter group-hover:text-primary transition-colors">{stock.symbol}</span>
                                 <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest line-clamp-1">{stock.description}</span>
                              </div>
                           </div>
                           <div className="px-4 py-2 bg-white/5 group-hover:bg-primary group-hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                             Watch <Plus size={14} />
                           </div>
                         </button>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-6 mb-6 text-[10px] font-black text-textMuted uppercase tracking-[0.3em]">
               <div className="col-span-4">Asset Identification</div>
               <div className="col-span-2 text-center">Live Market Price</div>
               <div className="col-span-3 text-center">Intraday Pulse</div>
               <div className="col-span-3 text-right">Operational Actions</div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.length > 0 ? items.map((item) => {
                  const liveData = liveWatchlist.find(l => l.symbol === item.symbol);
                  const currentPrice = liveData ? liveData.currentPrice : item.currentPrice;
                  const percentChange = liveData ? liveData.percentChange : item.percentChange;
                  const isBullish = percentChange >= 0;
                  
                  const alert = alerts.find(a => a.symbol === item.symbol);
                  const isAlertEnabled = alert?.enabled;

                  return (
                    <motion.div 
                      layout
                      key={item.symbol} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="grid grid-cols-12 gap-4 items-center p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden"
                    >
                      {/* Asset Info */}
                      <div className="col-span-4 flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl transition-transform group-hover:scale-110 ${isBullish ? 'bg-success/10 text-success shadow-success/10' : 'bg-danger/10 text-danger shadow-danger/10'}`}>
                            {item.symbol[0]}
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{item.symbol}</h3>
                               {isAlertEnabled && (
                                 <Bell size={14} className="text-primary animate-bounce" />
                               )}
                            </div>
                            <div className="flex gap-2">
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isBullish ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                  {isBullish ? 'Bullish Trend' : 'Bearish Trend'}
                               </span>
                               {alert && isAlertEnabled && (
                                 <span className="text-[9px] font-black bg-white/5 text-textMuted px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/5">
                                   Target: {alert.condition} {formatDual(alert.targetPrice).converted}
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Pricing */}
                      <div className="col-span-2 text-center">
                         <div className="text-2xl font-black text-white tracking-tighter mb-0 tabular-nums">
                            {formatDual(currentPrice).converted}
                         </div>
                         <div className={`text-xs font-black flex items-center justify-center gap-1.5 ${isBullish ? 'text-success' : 'text-danger'}`}>
                            {isBullish ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(percentChange).toFixed(2)}%
                         </div>
                      </div>

                      {/* Mini Sparkline */}
                      <div className="col-span-3 h-12 px-6">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={item.sparkline || []}>
                               <defs>
                                  <linearGradient id={`grad-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor={isBullish ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor={isBullish ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <Area 
                                  type="monotone" dataKey="price" 
                                  stroke={isBullish ? '#10b981' : '#ef4444'} 
                                  strokeWidth={3} fill={`url(#grad-${item.symbol})`} 
                                  animationDuration={1500}
                                />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex justify-end gap-3 pr-2">
                         <button 
                            onClick={() => openTrade(item.symbol, currentPrice)}
                            className="p-3.5 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 group/btn"
                            title="Execute Trade"
                         >
                            <DollarSign size={20} className="group-hover/btn:scale-125 transition-transform" />
                         </button>
                         <button 
                            onClick={() => handleQuickToggle(item.symbol, currentPrice)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveAlertItem(item);
                              setAlertTarget(alert?.targetPrice || (currentPrice * 1.05).toFixed(2));
                              setAlertCondition(alert?.condition || '>');
                            }}
                            className={`p-3.5 rounded-2xl transition-all border ${isAlertEnabled ? 'bg-success/20 text-success border-success/30 shadow-lg shadow-success/10' : 'bg-white/5 text-textMuted border-transparent hover:text-white hover:bg-white/10'}`}
                            title="Set Intelligence Alerts (Right-click for settings)"
                         >
                            {isAlertEnabled ? <Bell size={20} className="fill-current" /> : <Bell size={20} />}
                         </button>
                         <button 
                            onClick={() => removeAsset(item.symbol)}
                            className="p-3.5 rounded-2xl bg-white/5 text-textMuted hover:text-danger hover:bg-danger/10 hover:border-danger/20 border border-transparent transition-all"
                            title="Remove from surveillance"
                         >
                            <Trash2 size={20} />
                         </button>
                      </div>

                      {/* Background Glow */}
                      <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${isBullish ? 'bg-success/20 w-full' : 'bg-danger/20 w-full'}`} />
                    </motion.div>
                  );
                }) : (
                  <EmptyState type="watchlist" title="Pulse Flatlined" message="Your surveillance board is empty. Add assets to begin real-time market tracking." />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Intelligence Radar (Right Column) */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-b from-primary/10 to-transparent"
          >
            <h2 className="text-xs font-black text-white mb-8 uppercase tracking-[0.4em] flex items-center gap-3">
               <ShieldCheck size={18} className="text-primary" /> Intelligence
            </h2>
            
            <div className="space-y-6">
              <RadarCard 
                label="Average Momentum" 
                value={`${analytics.averageChangePercent >= 0 ? '+' : ''}${analytics.averageChangePercent.toFixed(2)}%`}
                sub="Watchlist Mean"
                color={analytics.averageChangePercent >= 0 ? 'success' : 'danger'}
              />
              <div className="h-px bg-white/5" />
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-success/5 border border-success/10 text-center">
                    <p className="text-[8px] font-black text-success/60 uppercase tracking-widest mb-1">Bullish</p>
                    <p className="text-xl font-black text-white">{analytics.greenCount}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-danger/5 border border-danger/10 text-center">
                    <p className="text-[8px] font-black text-danger/60 uppercase tracking-widest mb-1">Bearish</p>
                    <p className="text-xl font-black text-white">{analytics.redCount}</p>
                 </div>
              </div>
              <div className="h-px bg-white/5" />
              {analytics.topGainer && (
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                   <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3">Top Performer</p>
                   <div className="flex justify-between items-center">
                      <span className="text-xl font-black text-white tracking-tighter uppercase">{analytics.topGainer.symbol}</span>
                      <span className="text-sm font-black text-success tracking-tighter">+{analytics.topGainer.percentChange.toFixed(2)}%</span>
                   </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
             <div className="flex items-center gap-4">
                <Clock className="text-textMuted" size={20} />
                <div className="flex-1">
                   <p className="text-[10px] font-black text-textMuted uppercase tracking-widest">Global Status</p>
                   <p className="text-xs font-black text-white uppercase tracking-tight">Market {new Date().getHours() < 16 ? 'Open' : 'Closed'}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <Zap className="text-warning" size={20} />
                <div className="flex-1">
                   <p className="text-[10px] font-black text-textMuted uppercase tracking-widest">Active Alerts</p>
                   <p className="text-xs font-black text-white uppercase tracking-tight">{activeAlertsCount} Configured</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Alert Config Modal */}
      <AnimatePresence>
        {activeAlertItem && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setActiveAlertItem(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-surface p-10 rounded-[48px] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                   <Bell size={32} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Surveillance</h3>
                   <p className="text-xs font-bold text-textMuted uppercase tracking-[0.3em]">Configure {activeAlertItem.symbol}</p>
                </div>
              </div>

              <form onSubmit={handleAdvancedAlert} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                     <label className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em]">Alert Type</label>
                  </div>
                  <select
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value)}
                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                  >
                    <option value=">">Price Crosses Above</option>
                    <option value="<">Price Drops Below</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                     <label className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em]">Target Threshold (USD)</label>
                  </div>
                  <div className="relative group">
                     <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary transition-colors" size={20} />
                     <input
                       type="number" step="0.01"
                       value={alertTarget} onChange={(e) => setAlertTarget(e.target.value)}
                       className="w-full pl-12 pr-6 py-5 bg-black/40 border border-white/10 rounded-3xl focus:outline-none focus:border-primary transition-all text-white font-black text-xl tabular-nums"
                       placeholder="0.00"
                     />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setActiveAlertItem(null)} className="flex-1 py-5 rounded-[24px] bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" disabled={isActionLoading} className="flex-[2] py-5 rounded-[24px] bg-primary hover:bg-primaryHover text-white font-black uppercase tracking-tighter shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3">
                     Save Config <ShieldCheck size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TradeModal 
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stock={selectedStock}
        onSuccess={fetchWatchlist}
      />

    </div>
  );
};

const RadarCard = ({ label, value, sub, color }) => (
   <div className="group">
      <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
         <span className={`text-3xl font-black tracking-tighter text-${color} group-hover:scale-110 transition-transform inline-block`}>{value}</span>
         <span className="text-[10px] font-bold text-textMuted uppercase tracking-tight">{sub}</span>
      </div>
   </div>
);

export default Watchlist;

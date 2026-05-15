import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  X, 
  Info,
  BarChart3,
  Clock,
  Volume2,
  PieChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { api } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import TradeModal from '../components/TradeModal';
import { MarketSkeleton } from '../components/Skeletons';
import { useMarketStore } from '../store/marketStore';
import { useCurrencyStore } from '../store/currencyStore';
import EmptyState from '../components/EmptyState';

const Markets = () => {
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();
  
  // Zustand Stores
  const { 
    marketOverview, 
    liveStockData, 
    subscribeToStock, 
    unsubscribeFromStock 
  } = useSocketStore();

  const {
    selectedSymbol,
    selectedStockData,
    chartData,
    chartMode,
    isLoading: isMarketLoading,
    selectStock,
    updateLivePrice,
    setChartMode,
  } = useMarketStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockForModal, setSelectedStockForModal] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Handle URL changes and initial load
  useEffect(() => {
    const symbol = urlSymbol?.toUpperCase() || 'AAPL';
    if (symbol !== selectedSymbol) {
      handleSelectStock(symbol);
    }
  }, [urlSymbol]);

  // Sync live updates to the store
  useEffect(() => {
    if (selectedSymbol && liveStockData[selectedSymbol]) {
      updateLivePrice({
        symbol: selectedSymbol,
        ...liveStockData[selectedSymbol]
      });
    }
  }, [liveStockData, selectedSymbol, updateLivePrice]);

  useEffect(() => {
    setIsLoading(false);

    // Click outside search to close
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setShowResults(true);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = async (symbol) => {
    // Unsubscribe from previous
    if (selectedSymbol) unsubscribeFromStock(selectedSymbol);
    
    // Select via store
    await selectStock(symbol);
    
    // Subscribe to live updates
    subscribeToStock(symbol);
    
    setShowResults(false);
    setSearchQuery('');
    
    // Update URL
    if (urlSymbol !== symbol) {
      navigate(`/markets/${symbol}`, { replace: true });
    }
  };

  const openTradeModal = (symbol, price) => {
    setSelectedStockForModal({ symbol, currentPrice: price });
    setIsModalOpen(true);
  };

  // Mock historical data for the mini sparklines
  const generateMockChartData = (startPrice, isBullish) => {
    let current = startPrice;
    const data = [];
    for (let i = 0; i < 20; i++) {
      const volatility = current * 0.01;
      const change = (Math.random() - (isBullish ? 0.4 : 0.6)) * volatility;
      current += change;
      data.push({ price: current });
    }
    return data;
  };

  if (isLoading) {
    return <MarketSkeleton />;
  }

  // Use either live marketOverview or fallback to empty arrays
  const gainers = marketOverview.gainers.length > 0 ? marketOverview.gainers : [];
  const losers = marketOverview.losers.length > 0 ? marketOverview.losers : [];
  const trending = marketOverview.trending.length > 0 ? marketOverview.trending : [];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-1 flex items-center gap-4 tracking-tighter uppercase">
          Market Intelligence
          <div className="flex h-3 w-3 relative">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></div>
            <div className="relative inline-flex rounded-full h-3 w-3 bg-primary"></div>
          </div>
        </h1>
        <p className="text-textMuted font-medium">Tracking global assets with real-time institutional-grade data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Center Area: Search, Chart, Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Search Bar & Quick Suggestions */}
          <div className="space-y-4">
            <div className="relative" ref={searchRef}>
              <div className="glass rounded-[24px] p-2 flex items-center border border-white/10 focus-within:border-primary/50 transition-all shadow-2xl shadow-black/40 group bg-white/[0.02]">
                <Search className="ml-4 text-primary group-focus-within:scale-110 transition-transform" size={24} />
                <input 
                  type="text"
                  placeholder="Search global stocks (e.g. AAPL, TSLA, NVDA)..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-white placeholder:text-textMuted font-bold text-lg uppercase tracking-tight"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                />
                {searchQuery && (
                  <button onClick={() => {setSearchQuery(''); setSearchResults([]);}} className="p-2 hover:bg-white/10 rounded-full text-textMuted transition-colors mr-2">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 glass border border-white/10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-[400px] backdrop-blur-2xl"
                  >
                    {isSearching ? (
                      <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-4"></div>
                        <span className="text-textMuted font-black uppercase tracking-widest text-xs">Querying Global Markets...</span>
                      </div>
                    ) : (
                      <div className="p-3">
                        {searchResults.map((stock) => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleSelectStock(stock.symbol)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all text-left group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                                {stock.symbol[0]}
                              </div>
                              <div>
                                <span className="font-black text-white block text-lg tracking-tighter group-hover:text-primary transition-colors">{stock.symbol}</span>
                                <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest line-clamp-1">{stock.description}</span>
                              </div>
                            </div>
                            <div className="px-3 py-1.5 bg-white/5 rounded-xl text-[10px] text-textMuted uppercase font-black tracking-widest group-hover:bg-primary/20 group-hover:text-primary transition-all">
                              {stock.type || 'Stock'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-3 px-1 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[10px] font-black text-textMuted uppercase tracking-[0.3em] mr-2 whitespace-nowrap">Popular:</span>
              {['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL'].map(symbol => (
                <button 
                  key={symbol}
                  onClick={() => handleSelectStock(symbol)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black transition-all transform hover:-translate-y-1 active:translate-y-0 whitespace-nowrap tracking-widest ${selectedSymbol === symbol ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/5 text-textMuted hover:bg-white/10 hover:text-white border border-white/5'}`}
                >
                  {symbol}
                </button>
              ))}
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 flex-wrap">
              {['intraday', '1W', '1M', '3M', '1Y'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    chartMode === mode
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-textMuted hover:text-white hover:bg-white/10'
                  }`}
                >
                  {mode === 'intraday' ? '1D' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Intraday Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[40px] p-8 flex flex-col h-[550px] border border-white/5 shadow-2xl relative overflow-hidden bg-white/[0.01]"
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-1/2 h-1/2 blur-[120px] pointer-events-none transition-colors duration-1000 ${selectedStockData?.change >= 0 ? 'bg-success/5' : 'bg-danger/5'}`} />
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{selectedSymbol || 'Asset'}</h2>
                  {selectedStockData && (
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${selectedStockData.change >= 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      {selectedStockData.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {selectedStockData.percentChange?.toFixed(2)}%
                    </div>
                  )}
                  <div className="px-3 py-1 bg-white/5 rounded-xl text-[10px] font-black text-textMuted uppercase tracking-widest border border-white/5">
                    {selectedSymbol?.includes('.') ? 'International' : 'NASDAQ / NYSE'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-white tracking-tighter">
                      {formatDual(selectedStockData?.currentPrice || 0).converted}
                    </span>
                    <span className={`text-lg font-black tracking-tight ${selectedStockData?.change >= 0 ? 'text-success' : 'text-danger'}`}>
                      {selectedStockData?.change >= 0 ? '▲' : '▼'} {formatNative(Math.abs(selectedStockData?.change || 0))}
                    </span>
                  </div>
                  {currency !== 'USD' && (
                    <div className="text-sm font-black text-primary/80 tracking-widest uppercase mt-1">
                      Local Value: {format(selectedStockData?.currentPrice || 0)}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => openTradeModal(selectedSymbol, selectedStockData?.currentPrice)}
                disabled={!selectedSymbol || isMarketLoading}
                className="px-10 py-5 bg-primary hover:bg-primaryHover text-white font-black rounded-2xl transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/50 disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-tighter text-sm"
              >
                Execute Order
              </button>
            </div>
            
            <div className="flex-1 w-full relative">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedStockData?.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={selectedStockData?.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      minTickGap={40}
                      tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => chartMode === 'intraday' ? v : new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#475569"
                      domain={['auto', 'auto']}
                      tickFormatter={(t) => format(t).split('.')[0]}
                      tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                      axisLine={false} tickLine={false} width={80}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: '900' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      formatter={(value) => [format(value), 'Market Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={selectedStockData?.change >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#marketGradient)"
                      animationDuration={800}
                      dot={false}
                    />
                    {chartMode !== 'intraday' && (
                      <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="SMA 20" />
                    )}
                    {chartMode === '3M' || chartMode === '1Y' ? (
                      <Line type="monotone" dataKey="sma50" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="SMA 50" />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState type="chart" title="Signal Lost" message="Attempting to re-establish connection to market data stream..." />
              )}
            </div>
          </motion.div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Open', value: selectedStockData?.open, icon: <Clock size={18} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Day High', value: selectedStockData?.high, icon: <TrendingUp size={18} />, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Day Low', value: selectedStockData?.low, icon: <TrendingDown size={18} />, color: 'text-danger', bg: 'bg-danger/10' },
              { label: 'Volume', value: selectedStockData?.volume?.toLocaleString() || '0', icon: <Volume2 size={18} />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all hover-scale glow-card group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className="text-xl font-black text-white tracking-tighter">
                  {typeof stat.value === 'number' && stat.label !== 'Volume' ? format(stat.value) : stat.value || '—'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Market Cards */}
        <div className="space-y-6">
          
          {/* Market Sentiment Overview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-[32px] border border-white/10 shadow-2xl bg-gradient-to-br from-primary/20 to-transparent relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all transform group-hover:scale-110">
              <PieChart size={60} />
            </div>
            <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.2em] mb-4">Market Sentiment</h2>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-white tracking-tighter uppercase">Bullish</span>
              <span className="text-success font-bold text-xs mb-1.5 flex items-center gap-1">
                <ArrowUpRight size={14} /> +2.4% Today
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '68%' }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-textMuted uppercase tracking-widest">
              <span>Fear</span>
              <span>Greed</span>
            </div>
          </motion.div>
          
          {/* Top Gainers with Mini Charts */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-textMuted uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-success" /> Top Gainers
            </h3>
            {gainers.map((g, idx) => (
              <motion.div 
                key={g.ticker} 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelectStock(g.ticker)}
                className={`group flex items-center justify-between p-4 rounded-[24px] border transition-all cursor-pointer hover-scale glow-card ${selectedSymbol === g.ticker ? 'bg-success/10 border-success/30' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center font-black text-success text-xs shadow-lg shadow-success/10 group-hover:scale-110 transition-transform">
                    {g.ticker[0]}
                  </div>
                  <div>
                    <span className="font-black text-white block tracking-tighter text-base group-hover:text-primary transition-colors">{g.ticker}</span>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">{format(Number(g.price))}</span>
                  </div>
                </div>
                
                <div className="w-16 h-10 px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMockChartData(100, true)}>
                      <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fill="transparent" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-right">
                  <span className="text-success font-black text-sm tracking-tighter">+{g.change_percentage}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Top Losers with Mini Charts */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-textMuted uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <TrendingDown size={14} className="text-danger" /> Top Losers
            </h3>
            {losers.map((l, idx) => (
              <motion.div 
                key={l.ticker} 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 + 0.3 }}
                onClick={() => handleSelectStock(l.ticker)}
                className={`group flex items-center justify-between p-4 rounded-[24px] border transition-all cursor-pointer hover-scale glow-card ${selectedSymbol === l.ticker ? 'bg-danger/10 border-danger/30' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center font-black text-danger text-xs shadow-lg shadow-danger/10 group-hover:scale-110 transition-transform">
                    {l.ticker[0]}
                  </div>
                  <div>
                    <span className="font-black text-white block tracking-tighter text-base group-hover:text-primary transition-colors">{l.ticker}</span>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">{format(Number(l.price))}</span>
                  </div>
                </div>

                <div className="w-16 h-10 px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMockChartData(100, false)}>
                      <Area type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={2} fill="transparent" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-right">
                  <span className="text-danger font-black text-sm tracking-tighter">{l.change_percentage}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Trending Card with Volume Spikes */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-textMuted uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <Activity size={14} className="text-primary" /> Trending (Volume Spikes)
            </h3>
            {trending.map((t, idx) => (
              <motion.div 
                key={t.ticker} 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 + 0.6 }}
                onClick={() => handleSelectStock(t.ticker)}
                className={`group relative overflow-hidden flex items-center justify-between p-4 rounded-[24px] border transition-all cursor-pointer hover-scale glow-card ${selectedSymbol === t.ticker ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
              >
                <div className="absolute top-0 right-0 px-2 py-1 bg-primary/20 text-primary text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">
                  {idx === 0 ? 'High Volume' : idx === 1 ? 'Unusual Activity' : 'Trending'}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary text-xs shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                    {t.ticker[0]}
                  </div>
                  <div>
                    <span className="font-black text-white block tracking-tighter text-base group-hover:text-primary transition-colors">{t.ticker}</span>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">{format(Number(t.price))}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-black text-sm tracking-tighter ${Number(t.change_percentage.replace('%', '')) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {t.change_percentage}
                    </span>
                    <span className="text-[9px] text-textMuted font-bold uppercase tracking-tighter">VOL: {Math.floor(Math.random() * 50 + 10)}M</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      <TradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        stock={selectedStockForModal} 
        onSuccess={() => {}} 
      />
    </div>
  );
};

export default Markets;


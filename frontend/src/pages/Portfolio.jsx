import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, PieChart, Activity, 
  ArrowUpRight, ArrowDownRight, Briefcase, ChevronRight,
  Shield, Zap, Target, AlertTriangle, Clock, Award, Flag,
  Play, RefreshCw, BarChart2, Globe, Heart
} from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useTransactionStore } from '../store/transactionStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { PortfolioSkeleton } from '../components/Skeletons';
import TradeModal from '../components/TradeModal';
import EmptyState from '../components/EmptyState';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Portfolio = () => {
  const { user } = useAuthStore();
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  const { 
    holdings, 
    valuation, 
    history,
    isLoading, 
    isValuing,
    fetchPortfolio, 
    fetchHistory,
    startLiveValuation 
  } = usePortfolioStore();

  const { transactions, fetchTransactions, exportCSV, isLoading: isHistoryLoading } = useTransactionStore();

  const [activeTab, setActiveTab] = useState('HOLDINGS');
  const [timeframe, setTimeframe] = useState('1M');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayData, setReplayData] = useState([]);
  
  // Trade Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
    const stopLive = startLiveValuation(15000);
    return () => stopLive();
  }, [fetchPortfolio, startLiveValuation, fetchTransactions]);

  // Animated Growth Replay Logic
  const handleReplay = async () => {
    if (isReplaying || history.length === 0) return;
    setIsReplaying(true);
    setReplayData([history[0]]);
    
    for (let i = 1; i < history.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setReplayData(prev => [...prev, history[i]]);
    }
    setIsReplaying(false);
  };

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
    fetchHistory(tf);
  };

  // Compounding Projection Logic
  const projections = useMemo(() => {
    if (!valuation) return null;
    const current = valuation.totalValue;
    const rate = 0.12; // 12% annual
    return {
      fiveYears: current * Math.pow(1 + rate, 5),
      tenYears: current * Math.pow(1 + rate, 10),
      paceTo100k: current < 100000 ? Math.log(100000 / current) / Math.log(1 + rate) : 0
    };
  }, [valuation]);

  if (isLoading && !valuation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="mt-4 text-textMuted font-black uppercase tracking-widest text-xs animate-pulse text-center">
            Valuing Portfolio...
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Portfolio Value', 
      value: valuation?.totalValue || 0, 
      sub: `Momentum: ${valuation?.insights.momentum || 'STABLE'}`, 
      icon: <Wallet className="text-primary" />,
      trend: (valuation?.unrealizedPnL || 0) >= 0 ? 'up' : 'down'
    },
    { 
      label: 'Growth Efficiency', 
      value: valuation?.insights.growthEfficiency || 0, 
      sub: 'Risk-Adjusted Score', 
      icon: <Activity className="text-success" />,
      isRaw: true,
      isScore: true
    },
    { 
      label: 'Total Alpha', 
      value: valuation?.unrealizedPnL || 0, 
      sub: `${(valuation?.totalReturnPercentage || 0).toFixed(2)}% ROI`, 
      icon: <TrendingUp className={(valuation?.unrealizedPnL || 0) >= 0 ? 'text-success' : 'text-danger'} />,
      isPnL: true
    },
    { 
      label: 'Realized P&L', 
      value: valuation?.realizedPnL || 0, 
      sub: 'Lifetime Closed Profit', 
      icon: <Award className="text-yellow-400" />,
      isPnL: true
    }
  ];

  if (isLoading && holdings.length === 0) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header with Trajectory Meter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Alpha Terminal</h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-textMuted uppercase tracking-widest border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${isValuing ? 'bg-primary animate-ping' : 'bg-success'}`} />
              {isValuing ? 'Syncing Institutional Data...' : 'Engine Online'}
            </span>
            <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Growth Pace:</p>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                    Target {format(100000).split('.')[0]} in {projections?.paceTo100k.toFixed(1)} years
                </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleReplay}
          disabled={isReplaying}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/5 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] hover-scale"
        >
          <Play size={14} className={isReplaying ? 'animate-pulse' : ''} />
          {isReplaying ? 'Replaying History...' : 'Growth Replay'}
        </button>
      </div>

      {/* Main Growth Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div 
          className="lg:col-span-3 glass rounded-[48px] p-8 border border-white/5 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart2 size={200} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <p className="text-[10px] font-black text-textMuted uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                        <Activity size={14} className="text-primary" /> Portfolio Trajectory
                    </p>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-4">
                            <h2 className="text-5xl font-black text-white tracking-tighter">
                                {format(isReplaying ? replayData[replayData.length-1]?.totalValue : (valuation?.totalValue || 0))}
                            </h2>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tight flex items-center gap-1.5 ${(valuation?.totalReturnPercentage || 0) >= 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {(valuation?.totalReturnPercentage || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {Math.abs(valuation?.totalReturnPercentage || 0).toFixed(2)}%
                            </div>
                        </div>
                        {currency !== 'USD' && (
                          <div className="text-sm font-black text-primary/80 tracking-widest uppercase mt-1">
                            Base Value: {formatNative(isReplaying ? replayData[replayData.length-1]?.totalValue : (valuation?.totalValue || 0))}
                          </div>
                        )}
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {['1W', '1M', '3M', '1Y', 'ALL'].map(tf => (
                    <button
                        key={tf}
                        onClick={() => handleTimeframeChange(tf)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${timeframe === tf ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-white'}`}
                    >
                        {tf}
                    </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full relative z-10">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={isReplaying ? replayData : history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 800, backdropFilter: 'blur(10px)' }}
                            formatter={(value) => [format(Number(value)), 'Portfolio Value']}
                        />
                        <Area type="monotone" dataKey="totalValue" stroke="#10b981" strokeWidth={5} fill="url(#colorValue)" />
                        <Area type="monotone" dataKey="investedCapital" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorInvested)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState type="chart" title="Market Pulse Idle" message="Initialize your first trade to activate the trajectory visualizer." />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5 relative z-10">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} className="text-primary" /> Invested Capital
                    </p>
                    <p className="text-xl font-black text-white tracking-tighter">{format(history[history.length-1]?.investedCapital || 0)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
                        <Target size={12} className="text-success" /> Profit Reserve
                    </p>
                    <p className="text-xl font-black text-success tracking-tighter">{format(valuation?.unrealizedPnL || 0)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12} className="text-yellow-400" /> Compounding (5Y)
                    </p>
                    <p className="text-xl font-black text-white tracking-tighter">Proj: {format(projections?.fiveYears || 0)}</p>
                </div>
            </div>
        </motion.div>

        {/* Compounding sidebar */}
        <div className="space-y-6">
            <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock size={16} className="text-primary" /> Future Value
                </h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">5 Year Horizon (12%)</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{format(projections?.fiveYears || 0)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">10 Year Horizon (12%)</p>
                        <p className="text-3xl font-black text-primary tracking-tighter">{format(projections?.tenYears || 0)}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[9px] text-textMuted font-bold italic leading-relaxed">"Compounding is the 8th wonder of the world. Those who understand it, earn it."</p>
                    </div>
                </div>
            </div>

            <div className="glass p-8 rounded-[40px] border border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Award size={16} className="text-success" /> Milestones
                </h3>
                <div className="space-y-5">
                    {valuation?.insights?.milestones?.length > 0 ? (
                      valuation.insights.milestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                                {m.icon === 'Flag' ? <Flag size={16} /> : m.icon === 'Award' ? <Award size={16} /> : <TrendingUp size={16} />}
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white tracking-tight">{m.title}</h4>
                                <p className="text-[9px] text-textMuted font-bold uppercase tracking-widest">{new Date(m.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-textMuted font-black uppercase text-center py-4">No milestones yet</div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Intelligence Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all hover-scale"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className={`text-3xl font-black tracking-tighter mb-1 ${stat.isPnL ? (stat.value >= 0 ? 'text-success' : 'text-danger') : 'text-white'}`}>
                {stat.isScore ? 
                    <span className="flex items-baseline gap-1">
                        {stat.value}<span className="text-sm">/100</span>
                    </span>
                    : (stat.isRaw ? stat.value : formatDual(stat.value).converted)
                }
            </h3>
            <p className="text-[9px] font-bold text-textMuted uppercase tracking-widest">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Asset List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-4">
              {['HOLDINGS', 'INTELLIGENCE', 'HISTORY'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all pb-2 border-b-2 ${activeTab === tab ? 'text-primary border-primary' : 'text-textMuted border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'HOLDINGS' && (
              <motion.div 
                key="holdings"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {holdings.length > 0 ? (
                  holdings.map((holding) => (
                    <motion.div
                        key={holding.symbol}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white text-xl shadow-2xl group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                                {holding.symbol[0]}
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-primary transition-colors">{holding.symbol}</h4>
                                <p className="text-[10px] text-textMuted font-bold uppercase tracking-widest">{holding.sector} • {Number(holding.quantity).toFixed(4)} Units</p>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-12">
                             <div className="text-right">
                                <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Unrealized</p>
                                <p className={`text-base font-black tracking-tighter ${holding.unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {format(holding.unrealizedPnL)}
                                </p>
                            </div>
                             <div className="text-right">
                                <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Weight</p>
                                <p className="text-base font-black text-white tracking-tighter">{(holding.percentOfPortfolio || 0).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="text-right flex items-center gap-6">
                            <div className="hidden lg:flex items-center gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStock({ 
                                            symbol: holding.symbol, 
                                            currentPrice: holding.marketValue / holding.quantity,
                                            sector: holding.sector
                                        });
                                        setTradeType('BUY');
                                        setIsTradeModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-white/5 hover:bg-success/20 text-textMuted hover:text-success rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                                >
                                    Buy More
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStock({ 
                                            symbol: holding.symbol, 
                                            currentPrice: holding.marketValue / holding.quantity,
                                            sector: holding.sector
                                        });
                                        setTradeType('SELL');
                                        setIsTradeModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-white/5 hover:bg-danger/20 text-textMuted hover:text-danger rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                                >
                                    Sell
                                </button>
                            </div>

                            <div className="flex flex-col items-end">
                                <p className="text-2xl font-black text-white tracking-tighter">
                                    {format(holding.marketValue || 0)}
                                </p>
                                {currency !== 'USD' && (
                                <p className="text-[10px] font-black text-primary/60 tracking-tighter">
                                    ≈ {formatNative(holding.marketValue || 0)}
                                </p>
                                )}
                                <div className={`flex items-center justify-end gap-1 font-black text-xs uppercase tracking-tighter ${holding.unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {holding.unrealizedPnL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(holding.returnPercentage || 0).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState type="portfolio" title="Vault Empty" message="Your holdings terminal is waiting for data. Deploy capital to see live valuation." />
                )}
              </motion.div>
            )}

            {activeTab === 'INTELLIGENCE' && (
               <motion.div 
                key="intelligence"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
               >
                    <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6 flex flex-col items-center">
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] self-start">Sector Allocation</h3>
                        <div className="h-[250px] w-full">
                          {Object.keys(valuation?.insights?.sectorAllocation || {}).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPie>
                                <Pie
                                  data={Object.entries(valuation?.insights?.sectorAllocation || {}).map(([name, value]) => ({ name, value }))}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {Object.entries(valuation?.insights?.sectorAllocation || {}).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', backdropFilter: 'blur(10px)' }} />
                              </RechartsPie>
                            </ResponsiveContainer>
                          ) : <EmptyState title="No Sectors" message="Sector diversification data pending holdings." />}
                        </div>
                    </div>
                    <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6 flex flex-col items-center">
                        <h3 className="text-xs font-black text-success uppercase tracking-[0.3em] self-start">Asset Concentration</h3>
                        <div className="h-[250px] w-full">
                          {holdings.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPie>
                                <Pie
                                  data={holdings.map(h => ({ name: h.symbol, value: h.marketValue }))}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {holdings.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', backdropFilter: 'blur(10px)' }} />
                              </RechartsPie>
                            </ResponsiveContainer>
                          ) : <EmptyState title="No Assets" message="Concentration metrics pending deployment." />}
                        </div>
                    </div>
               </motion.div>
            )}

            {activeTab === 'HISTORY' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Transaction Ledger</h3>
                  <button 
                    onClick={exportCSV}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-xl border border-white/5 transition-all"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="glass rounded-[32px] overflow-hidden border border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black text-textMuted uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Asset</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-white">
                      {transactions.length > 0 ? (
                        transactions.map((t) => (
                          <tr key={t._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-all">
                            <td className="px-6 py-4 font-black">{t.symbol}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${t.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">{Number(t.quantity).toFixed(4)}</td>
                            <td className="px-6 py-4">{format(t.price)}</td>
                            <td className="px-6 py-4">{formatDual(t.totalAmount).converted}</td>
                            <td className="px-6 py-4 text-textMuted">{new Date(t.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-textMuted font-black uppercase tracking-widest text-[10px]">No historical records</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
            <div className="glass p-8 rounded-[40px] border border-white/5 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl" />
                <h3 className="text-xs font-black text-textMuted uppercase tracking-[0.3em] flex items-center gap-2">
                    <Target size={14} className="text-primary" /> Alpha Breakdown
                </h3>

                <div className="space-y-6">
                    {Object.entries(valuation?.insights?.sectorAllocation || {}).length > 0 ? (
                      Object.entries(valuation?.insights?.sectorAllocation || {}).map(([sector, val], i) => (
                        <div key={sector} className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-white">{sector}</span>
                                <span className="text-textMuted">{(val / (valuation?.holdingsValue || 1) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(val / (valuation?.holdingsValue || 1) * 100)}%` }}
                                    className="h-full bg-primary"
                                    transition={{ duration: 1.5, delay: i * 0.1 }}
                                />
                            </div>
                        </div>
                      ))
                    ) : <p className="text-[10px] text-textMuted font-black uppercase text-center">Awaiting Data</p>}
                </div>
            </div>

            <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-2xl">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Advisor Insight</h4>
                        <p className="text-[10px] font-black text-primary uppercase">Risk: Optimal</p>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-textMuted leading-relaxed uppercase tracking-tight">
                    "Your portfolio momentum is currently <span className="text-white">{valuation?.insights?.momentum || 'STABLE'}</span>. Your strategic capital allocation has optimized the trajectory toward your next milestone."
                </p>
                <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all hover-scale">
                    Full Risk Report
                </button>
            </div>
        </div>
      </div>
      {/* Trade Modal Integration */}
      <TradeModal 
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stock={selectedStock}
        initialType={tradeType}
        onSuccess={async () => {
            fetchPortfolio();
            fetchTransactions();
        }}
      />
    </div>
  );
};

export default Portfolio;

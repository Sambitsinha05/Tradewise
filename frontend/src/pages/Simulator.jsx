import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine, LineChart, Line
} from 'recharts';
import { 
  Calculator, TrendingUp, ShieldCheck, DollarSign, 
  Target, Zap, Flame, RefreshCcw, Info, ArrowRight, Play,
  Search, BarChart3, PieChart, Activity, AlertCircle, History,
  TrendingDown, Sparkles, BrainCircuit, Landmark
} from 'lucide-react';
import { api } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import { 
  calculateFutureValue, 
  adjustForInflation, 
  generateScenarioProjections, 
  runMonteCarloSimulation,
  calculateWealthMultiple
} from '../utils/financeCalculators';

const Simulator = () => {
  const { format, formatNative, currency } = useCurrencyStore();
  
  // Input State (Local to Sliders)
  const [inputs, setInputs] = useState({
    initialInvestment: 10000,
    monthlyContribution: 500,
    annualReturnRate: 12,
    volatility: 15,
    investmentDurationYears: 25,
    inflationRate: 5,
    annualExpenses: 40000,
    selectedSymbol: 'SPY',
  });

  // Simulation Results (Only updates on "Run")
  const [projectionResults, setProjectionResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // UI State
  const [activeMode, setActiveMode] = useState('GROWTH'); // GROWTH, FIRE, MONTE_CARLO
  const [activeScenario, setActiveScenario] = useState('base');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayYear, setReplayYear] = useState(0);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const searchRef = useRef(null);

  // Initial Calculation
  useEffect(() => {
    runProjection();
  }, []);

  const runProjection = () => {
    setIsSimulating(true);
    
    // Artificial delay for premium feel
    setTimeout(() => {
      const allScenarios = generateScenarioProjections(
        inputs.initialInvestment,
        inputs.monthlyContribution,
        inputs.annualReturnRate,
        inputs.investmentDurationYears,
        inputs.volatility,
        inputs.inflationRate
      );

      const monteCarlo = runMonteCarloSimulation(
        inputs.initialInvestment,
        inputs.monthlyContribution,
        inputs.annualReturnRate,
        inputs.investmentDurationYears,
        inputs.volatility
      );

      const baseSeries = allScenarios.base;
      const finalYear = baseSeries[baseSeries.length - 1];
      
      setProjectionResults({
        allScenarios,
        monteCarlo,
        summary: finalYear,
        wealthMultiple: calculateWealthMultiple(finalYear.futureValue, finalYear.totalInvested),
      });
      setIsSimulating(false);
    }, 600);
  };

  // Fetch Symbol Analytics
  const fetchSymbolAnalytics = async (symbol) => {
    setIsFetchingAnalytics(true);
    try {
      const res = await api.get(`/market/analytics/${symbol}`);
      const { cagr, volatility } = res.data;
      setInputs(prev => ({
        ...prev,
        selectedSymbol: symbol,
        annualReturnRate: parseFloat(cagr.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2))
      }));
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

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

  // Replay Logic
  useEffect(() => {
    let interval;
    if (isReplaying) {
      setReplayYear(0);
      interval = setInterval(() => {
        setReplayYear(prev => {
          if (prev >= inputs.investmentDurationYears) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isReplaying, inputs.investmentDurationYears]);

  if (!projectionResults) return null;

  const chartData = projectionResults.allScenarios[activeScenario];
  const filteredSeries = isReplaying ? chartData.slice(0, replayYear + 1) : chartData;
  const currentPoint = filteredSeries[filteredSeries.length - 1];

  const scenarioAssumptions = {
    pessimistic: { 
      label: 'Bear Market', 
      desc: 'Significant market headwinds. Assumes -50% of asset volatility as a return drag.',
      icon: <TrendingDown className="text-danger" />,
      color: 'danger'
    },
    base: { 
      label: 'Historical Mean', 
      desc: 'Based on true historical CAGR and long-term averages for this asset class.',
      icon: <Activity className="text-primary" />,
      color: 'primary'
    },
    optimistic: { 
      label: 'Bull Cycle', 
      desc: 'Above-average growth conditions. Assumes +50% of volatility as alpha gain.',
      icon: <Sparkles className="text-success" />,
      color: 'success'
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">Intelligence Tool</span>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                Wealth Terminal
             </h1>
          </div>
          <p className="text-textMuted font-medium">Professional grade asset modeling and risk-adjusted wealth projections.</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          {['GROWTH', 'MONTE_CARLO', 'FIRE_TARGET'].map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${activeMode === mode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-white'}`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Parameters Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          {/* Main Controls */}
          <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xs font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                 <BrainCircuit size={16} className="text-primary" /> Parameters
               </h2>
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-amber-500 animate-pulse' : 'bg-success'}`} />
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">{isSimulating ? 'Processing...' : 'Ready'}</span>
               </div>
            </div>

            <div className="space-y-8">
              {/* Asset Discovery */}
              <div className="relative" ref={searchRef}>
                 <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-primary transition-all group">
                    <Search size={18} className="text-textMuted mr-4 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search Asset (AAPL, BTC, GOLD)"
                      className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-textMuted/40 font-black uppercase tracking-tight"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                 </div>

                 <AnimatePresence>
                   {searchQuery.length >= 2 && searchResults.length > 0 && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                       className="absolute top-full left-0 right-0 mt-3 glass border border-white/10 rounded-[24px] shadow-2xl z-[100] overflow-hidden max-h-[300px] backdrop-blur-3xl"
                     >
                       {searchResults.map((stock) => (
                         <button
                           key={stock.symbol}
                           onClick={() => {
                             fetchSymbolAnalytics(stock.symbol);
                             setSearchQuery('');
                             setSearchResults([]);
                           }}
                           className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left group"
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary group-hover:scale-110 transition-transform">
                                {stock.symbol[0]}
                              </div>
                              <div>
                                 <span className="font-black text-white text-base block tracking-tighter">{stock.symbol}</span>
                                 <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest line-clamp-1">{stock.description}</span>
                              </div>
                           </div>
                           <ArrowRight size={16} className="text-textMuted group-hover:text-primary transition-colors" />
                         </button>
                       ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              {/* Sliders */}
              <div className="space-y-7">
                <SliderInput 
                  label="Initial Capital" 
                  value={inputs.initialInvestment}
                  min={0} max={1000000} step={5000}
                  format={(v) => format(v)}
                  onChange={(v) => setInputs(p => ({ ...p, initialInvestment: v }))}
                />
                <SliderInput 
                  label="Monthly Contribution" 
                  value={inputs.monthlyContribution}
                  min={0} max={50000} step={500}
                  format={(v) => format(v)}
                  onChange={(v) => setInputs(p => ({ ...p, monthlyContribution: v }))}
                />
                <SliderInput 
                  label="Expected Return (CAGR)" 
                  value={inputs.annualReturnRate}
                  min={0} max={50} step={0.1}
                  format={(v) => `${v}%`}
                  subLabel={`Based on ${inputs.selectedSymbol} historical data`}
                  onChange={(v) => setInputs(p => ({ ...p, annualReturnRate: v }))}
                />
                <SliderInput 
                  label="Duration (Years)" 
                  value={inputs.investmentDurationYears}
                  min={1} max={50} step={1}
                  format={(v) => `${v} Years`}
                  onChange={(v) => setInputs(p => ({ ...p, investmentDurationYears: v }))}
                />
                <SliderInput 
                  label="Volatility (Risk Profile)" 
                  value={inputs.volatility}
                  min={0} max={100} step={1}
                  format={(v) => `${v}%`}
                  onChange={(v) => setInputs(p => ({ ...p, volatility: v }))}
                />
              </div>

              {/* Projection Trigger */}
              <button
                onClick={runProjection}
                disabled={isSimulating}
                className="w-full py-6 bg-primary hover:bg-primaryHover text-white font-black rounded-3xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-duration-1000" />
                {isSimulating ? (
                  <RefreshCcw className="animate-spin" size={20} />
                ) : (
                  <>
                    <Zap size={20} className="group-hover:scale-125 transition-transform" />
                    <span className="tracking-tighter text-lg uppercase">Run Wealth Projection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scenario Selection Cards */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-textMuted uppercase tracking-[0.4em] ml-4">Market Conditions</h3>
             <div className="space-y-3">
                {Object.entries(scenarioAssumptions).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setActiveScenario(key)}
                    className={`w-full p-5 rounded-[28px] border transition-all text-left flex items-start gap-4 group ${
                      activeScenario === key 
                        ? `bg-${data.color}/10 border-${data.color}/30 shadow-lg shadow-${data.color}/5` 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activeScenario === key ? `bg-${data.color}/20` : 'bg-white/5'
                    }`}>
                      {data.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-tight mb-1 ${activeScenario === key ? `text-${data.color}` : 'text-white'}`}>
                        {data.label}
                      </h4>
                      <p className="text-[10px] font-medium text-textMuted leading-relaxed">
                        {data.desc}
                      </p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </motion.div>

        {/* Results Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard 
              label="Wealth Target" 
              value={currentPoint.futureValue} 
              sub="Projected terminal capital"
              color="primary"
            />
            <SummaryCard 
              label="Wealth Multiple" 
              value={`${projectionResults.wealthMultiple.toFixed(1)}x`}
              sub="Return on Invested Capital"
              color="success"
              isRaw
            />
            <SummaryCard 
              label="Spending Power" 
              value={currentPoint.inflationAdjustedValue} 
              sub="Inflation Adjusted (Today's Value)"
              color="warning"
            />
          </div>

          {/* Chart Wrapper */}
          <motion.div 
            layout
            className="glass rounded-[48px] p-10 border border-white/5 relative overflow-hidden min-h-[600px] flex flex-col bg-white/[0.01]"
          >
            <div className={`absolute top-0 right-0 w-1/2 h-1/2 blur-[140px] pointer-events-none transition-all duration-1000 ${
              activeScenario === 'optimistic' ? 'bg-success/5' : activeScenario === 'pessimistic' ? 'bg-danger/5' : 'bg-primary/5'
            }`} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                       <Landmark size={14} className="text-primary" />
                       <span className="text-[10px] font-black text-textMuted uppercase tracking-[0.4em]">Asset: {inputs.selectedSymbol}</span>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter uppercase">
                        Growth Trajectory <span className="text-textMuted">/</span> {scenarioAssumptions[activeScenario].label}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setIsReplaying(true)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all"
                   >
                     <Play size={14} /> Replay Growth
                   </button>
                   <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest">
                      {inputs.investmentDurationYears}Y Projection
                   </div>
                </div>
            </div>

            <div className="flex-1 w-full relative z-10">
               <AnimatePresence mode="wait">
                 {isSimulating ? (
                   <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                   >
                      <div className="relative">
                         <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                         <BrainCircuit className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
                      </div>
                      <p className="text-xs font-black text-textMuted uppercase tracking-[0.5em] animate-pulse">Running Monte Carlo Simulations...</p>
                   </motion.div>
                 ) : (
                   <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full"
                   >
                     {activeMode === 'MONTE_CARLO' ? (
                       <MonteCarloVisual simulation={projectionResults.monteCarlo} format={format} />
                     ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredSeries}>
                          <defs>
                            <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={activeScenario === 'optimistic' ? '#10b981' : activeScenario === 'pessimistic' ? '#ef4444' : '#3b82f6'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={activeScenario === 'optimistic' ? '#10b981' : activeScenario === 'pessimistic' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="year" 
                            stroke="#475569" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#475569" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                            tickFormatter={(v) => format(v).split('.')[0]} 
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" name="Total Contributions" dataKey="totalInvested" 
                            stroke="#475569" strokeWidth={2} fill="#47556910" 
                          />
                          <Area 
                            type="monotone" name="Wealth Projection" dataKey="futureValue" 
                            stroke={activeScenario === 'optimistic' ? '#10b981' : activeScenario === 'pessimistic' ? '#ef4444' : '#3b82f6'} 
                            strokeWidth={5} fill="url(#wealthGrad)" 
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>

          {/* Probability & Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8 bg-white/[0.01]">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Target size={18} className="text-primary" /> Risk-Adjusted Outcomes
                </h4>
                <div className="space-y-8">
                    <ProbabilityStat 
                        label="Optimistic (P90)" 
                        value={projectionResults.monteCarlo.p90} 
                        sub="Top 10% market performance"
                        color="text-success"
                    />
                    <div className="h-px bg-white/5" />
                    <ProbabilityStat 
                        label="Median (P50)" 
                        value={projectionResults.monteCarlo.median} 
                        sub="Most likely probability path"
                        color="text-primary"
                    />
                    <div className="h-px bg-white/5" />
                    <ProbabilityStat 
                        label="Conservative (P10)" 
                        value={projectionResults.monteCarlo.p10} 
                        sub="Bottom 10% market crash scenario"
                        color="text-danger"
                    />
                </div>
             </div>

             <div className="glass p-10 rounded-[40px] border border-white/5 flex flex-col justify-between bg-gradient-to-br from-warning/5 to-transparent">
                <div>
                   <h4 className="text-xs font-black text-warning uppercase tracking-[0.2em] flex items-center gap-3 mb-8">
                      <Sparkles size={18} /> Asset Insights
                   </h4>
                   <div className="space-y-6">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white flex-shrink-0">
                            <Zap size={20} />
                         </div>
                         <p className="text-sm font-medium text-textMuted leading-relaxed">
                            With a <span className="text-white font-bold">{inputs.annualReturnRate}%</span> CAGR, your wealth is expected to double every <span className="text-success font-black">{(72 / inputs.annualReturnRate).toFixed(1)} years</span> (Rule of 72).
                         </p>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white flex-shrink-0">
                            <Activity size={20} />
                         </div>
                         <p className="text-sm font-medium text-textMuted leading-relaxed">
                            Current asset volatility is <span className="text-white font-bold">{inputs.volatility}%</span>. This implies a potential annual swing of <span className="text-danger font-bold">{format(currentPoint.futureValue * (inputs.volatility/100))}</span> at terminal value.
                         </p>
                      </div>
                   </div>
                </div>
                
                <div className="pt-8 mt-8 border-t border-white/5">
                   <p className="text-[10px] font-black text-textMuted uppercase tracking-widest leading-loose">
                      * Projections are based on historical data. Past performance does not guarantee future results.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SliderInput = ({ label, value, min, max, step, format, onChange, subLabel }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <div>
        <label className="text-[10px] font-black text-textMuted uppercase tracking-widest block mb-1">{label}</label>
        {subLabel && <span className="text-[8px] font-bold text-textMuted/60 uppercase block">{subLabel}</span>}
      </div>
      <span className="text-sm font-black text-white tracking-tighter bg-white/5 px-3 py-1 rounded-lg">{format(value)}</span>
    </div>
    <div className="relative group py-2">
      <input
        type="range"
        min={min} max={max} step={step}
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1 bg-white/10 rounded-full cursor-pointer appearance-none transition-all hover:bg-white/20"
      />
    </div>
  </div>
);

const SummaryCard = ({ label, value, sub, color, isRaw }) => {
  const { format, formatNative, formatDual } = useCurrencyStore();
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group bg-white/[0.01]"
    >
      <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity text-${color}`}>
          <Landmark size={64} />
      </div>
      <div className="relative z-10">
        <p className={`text-[10px] font-black text-${color} uppercase tracking-[0.3em] mb-3`}>{label}</p>
        <h3 className="text-4xl font-black text-white tracking-tighter mb-0">
            {isRaw ? value : formatDual(value).converted}
        </h3>
        {!isRaw && useCurrencyStore.getState().currency !== 'USD' && (
          <p className={`text-sm font-black text-${color}/80 tracking-tighter mb-2`}>
            Base: {formatNative(value)}
          </p>
        )}
        <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest opacity-60">{sub}</p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 bg-${color} opacity-20 group-hover:opacity-100 transition-all`} style={{ width: '100%' }} />
    </motion.div>
  );
};

const ProbabilityStat = ({ label, value, sub, color }) => {
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  return (
    <div className="flex justify-between items-center group">
        <div>
            <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[9px] font-bold text-textMuted/40 uppercase tracking-tighter">{sub}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${color} tracking-tighter group-hover:scale-110 transition-transform`}>
            {formatDual(value).converted}
          </p>
          {currency !== 'USD' && (
            <p className="text-[10px] font-black text-white/40 tracking-tighter">
              ≈ {format(value)}
            </p>
          )}
        </div>
    </div>
  );
};

const MonteCarloVisual = ({ simulation, format }) => (
    <div className="h-full flex flex-col justify-center space-y-12">
        <div className="flex justify-around items-end h-64 gap-8 px-12">
            {[
                { label: 'Conservative (P10)', val: simulation.p10, h: 40, color: '#ef4444', icon: <TrendingDown size={20} /> },
                { label: 'Median (P50)', val: simulation.median, h: 80, color: '#3b82f6', icon: <Activity size={20} /> },
                { label: 'Optimistic (P90)', val: simulation.p90, h: 100, color: '#10b981', icon: <TrendingUp size={20} /> }
            ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-6 flex-1 h-full justify-end">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${b.h}%` }}
                        className="w-full rounded-[32px] opacity-40 group hover:opacity-100 transition-all cursor-pointer relative flex flex-col items-center justify-start py-6"
                        style={{ backgroundColor: b.color }}
                    >
                         <div className="text-white opacity-40 group-hover:opacity-100 transition-opacity">
                            {b.icon}
                         </div>
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 font-black text-white text-base whitespace-nowrap bg-black/40 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                            {format(b.val)}
                         </div>
                    </motion.div>
                    <div className="text-center">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-1">{b.label.split(' ')[0]}</span>
                       <span className="text-[8px] font-bold text-textMuted uppercase opacity-60">{b.label.split(' ')[1]}</span>
                    </div>
                </div>
            ))}
        </div>
        <div className="text-center max-w-2xl mx-auto px-10">
            <p className="text-xs font-bold text-textMuted uppercase leading-relaxed tracking-widest opacity-40">
                Quantitative risk assessment utilizing 100 random market trajectories based on historical volatility spikes and geometric asset growth.
            </p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  const { format } = useCurrencyStore();
  if (active && payload && payload.length) {
    return (
      <div className="glass p-6 rounded-[32px] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <p className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] mb-4 pb-4 border-b border-white/5 flex items-center gap-2">
           <Activity size={12} /> Timeline: Year {label}
        </p>
        <div className="space-y-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex justify-between items-center gap-12">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                       <span className="text-[10px] font-black text-white uppercase tracking-tighter">{entry.name}</span>
                    </div>
                    <span className="text-sm font-black text-white tabular-nums">{format(entry.value)}</span>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
           <div className="flex justify-between items-center text-[9px] font-black text-success uppercase tracking-widest">
              <span>Return Multiple</span>
              <span>{(payload[1].value / payload[0].value).toFixed(2)}x</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Simulator;

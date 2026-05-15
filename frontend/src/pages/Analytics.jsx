import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Activity, PieChart as PieIcon, 
  BarChart2, History, TrendingDown, Info, Zap, Target
} from 'lucide-react';
import { api } from '../store/authStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useCurrencyStore } from '../store/currencyStore';
import EmptyState from '../components/EmptyState';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// Safe formatter – never renders NaN, undefined, or Infinity
const safeNum = (v, decimals = 2, fallback = '—') => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
};

const MetricCard = ({ label, value, sub, icon, color = 'text-white', highlight }) => (
  <div className={`group space-y-1 p-4 rounded-2xl border transition-all hover:bg-white/5 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-white/5'}`}>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">{label}</span>
      {icon}
    </div>
    <div className={`text-2xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left ${color}`}>{value}</div>
    {sub && <div className="text-[10px] font-bold text-textMuted/60 italic uppercase tracking-tighter">{sub}</div>}
  </div>
);

const Analytics = () => {
  const { holdings, fetchPortfolio } = usePortfolioStore();
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allocation');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          api.get('/portfolio/analytics'),
          api.get('/portfolio/history?timeframe=ALL'),
          fetchPortfolio()
        ]);
        setAnalytics(analyticsRes.data);
        setHistory(historyRes.data || []);
      } catch (error) {
        console.error('Error fetching analytics', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchPortfolio]);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-48 bg-white/5 rounded-[32px]" />
          <div className="h-48 bg-white/5 rounded-[32px]" />
        </div>
        <div className="h-96 bg-white/5 rounded-[40px]" />
      </div>
    );
  }

  if (!analytics || holdings.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">Premium</span>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Deep Analytics</h1>
            </div>
            <p className="text-textMuted font-medium">Institutional-grade quantitative risk assessment &amp; performance attribution.</p>
          </div>
        </div>
        <EmptyState 
          type="analytics" 
          title="Intelligence Dark" 
          message="No portfolio data found. Execute trades or import history to generate deep quantitative insights." 
        />
      </div>
    );
  }

  const { assetAllocation = [], sectorDiversification = [], healthScore = 0, recommendations = [], riskCategory = 'N/A', historicalMetrics = {} } = analytics;
  const hm = historicalMetrics;

  const pieData = assetAllocation.map(a => ({ name: a.symbol, value: +safeNum(a.percentage, 1) }));
  const barData = sectorDiversification.map(s => ({ name: s.sector, percentage: +safeNum(s.percentage, 1) }));

  const drawdownData = (history || []).reduce((acc, point) => {
    const v = point.totalValue || 0;
    if (v > acc.peak) acc.peak = v;
    const dd = acc.peak > 0 ? ((acc.peak - v) / acc.peak) * 100 : 0;
    acc.series.push({ date: point.date, drawdown: -dd, value: v });
    return acc;
  }, { peak: 0, series: [] }).series;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const name = payload[0].name;
    return (
      <div className="glass border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-1">
          {label ? new Date(label).toLocaleDateString() : payload[0].name}
        </p>
        <p className="text-white font-black text-lg">
          {name === 'drawdown' ? `${safeNum(val)}%` :
           name === 'percentage' ? `${safeNum(val, 1)}%` :
           name === 'totalValue' ? formatDual(val).converted :
           `${safeNum(val, 1)}%`}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">Premium</span>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Deep Analytics</h1>
          </div>
          <p className="text-textMuted font-medium">Institutional-grade quantitative risk assessment &amp; performance attribution.</p>
        </div>
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
          {[
            { id: 'allocation', icon: <PieIcon size={16} />, label: 'Allocation' },
            { id: 'performance', icon: <History size={16} />, label: 'Growth' },
            { id: 'risk', icon: <Activity size={16} />, label: 'Risk' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-tighter ${
                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Score + Quant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Health Ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[32px] lg:col-span-2 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden"
        >
          <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-10 ${
            healthScore > 80 ? 'bg-success' : healthScore > 50 ? 'bg-amber-500' : 'bg-danger'
          }`} />
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-2xl">
              <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${healthScore}, 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className={healthScore > 80 ? 'text-success' : healthScore > 50 ? 'text-amber-500' : 'text-danger'}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tighter">{healthScore}</span>
              <span className="text-[9px] font-black text-textMuted uppercase tracking-widest">Health</span>
            </div>
          </div>
          <div className="flex-1 z-10 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-1 flex items-center gap-3">
                {healthScore > 80 ? <ShieldCheck className="text-success" size={28} /> : <AlertTriangle className="text-amber-500" size={28} />}
                {healthScore > 80 ? 'Excellent Stability' : healthScore > 50 ? 'Moderate Risk' : 'High Concentration'}
              </h2>
              <p className="text-textMuted text-sm font-medium">
                Risk profile: <span className="text-white font-bold uppercase">{riskCategory}</span> · {holdings.length} holdings analyzed
              </p>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-bold text-textMuted bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0 shadow-[0_0_6px_#3b82f6]" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quant Metrics — Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass p-6 rounded-[32px] border border-white/5 space-y-3"
        >
          <h3 className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] mb-4">Return Metrics</h3>
          <MetricCard label="CAGR" value={`${safeNum(hm.cagr)}%`} sub="Compound Annual Growth" icon={<TrendingUp size={14} className="text-success" />} color="text-success" />
          <MetricCard label="Sharpe Ratio" value={safeNum(hm.sharpeRatio)} sub="Risk-Adjusted Return" icon={<Target size={14} className="text-primary" />} highlight={hm.sharpeRatio > 1} />
          <MetricCard label="Sortino Ratio" value={safeNum(hm.sortinoRatio)} sub="Downside-Adj. Return" icon={<Activity size={14} className="text-primary" />} />
          <MetricCard label="Alpha" value={`${safeNum(hm.alpha)}%`} sub="vs. Market Benchmark" icon={<Zap size={14} className="text-yellow-400" />} color={Number(hm.alpha) >= 0 ? 'text-success' : 'text-danger'} />
        </motion.div>

        {/* Quant Metrics — Right Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass p-6 rounded-[32px] border border-white/5 space-y-3"
        >
          <h3 className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] mb-4">Risk Metrics</h3>
          <MetricCard label="Volatility" value={`${safeNum(hm.volatility, 1)}%`} sub="Annualized Std Dev" icon={<Activity size={14} className="text-danger" />} color="text-danger" />
          <MetricCard label="Beta" value={safeNum(hm.beta)} sub="Market Correlation" icon={<BarChart2 size={14} className="text-amber-400" />} />
          <MetricCard label="Max Drawdown" value={`-${safeNum(hm.maxDrawdown, 1)}%`} sub="Peak-to-Trough" icon={<TrendingDown size={14} className="text-danger" />} color="text-danger" />
          <MetricCard label="VaR (95%)" value={format(hm.var95)} sub="Daily Value at Risk" icon={<Info size={14} className="text-textMuted" />} color="text-amber-400" />
        </motion.div>
      </div>

      {/* Tabbed Charts */}
      <AnimatePresence mode="wait">
        {activeTab === 'allocation' && (
          <motion.div key="allocation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="glass p-10 rounded-[40px] border border-white/5 h-[460px] flex flex-col bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-6">
                <PieIcon className="text-primary" size={22} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Asset Concentration</h3>
              </div>
              <div className="flex-1">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={6} dataKey="value" stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-textMuted text-sm">No holdings to chart.</div>
                )}
              </div>
            </div>

            <div className="glass p-10 rounded-[40px] border border-white/5 h-[460px] flex flex-col bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-6">
                <BarChart2 className="text-success" size={22} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Sector Diversification</h3>
              </div>
              <div className="flex-1">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} fontWeight="bold" width={90} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CustomTooltip />} />
                      <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={28}>
                        {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-textMuted text-sm">No sector data.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div key="performance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass p-10 rounded-[40px] border border-white/5 h-[520px] flex flex-col bg-white/[0.01]"
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="text-primary" size={22} />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Historical Portfolio Value</h3>
            </div>
            <div className="flex-1">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} fontWeight="bold" tickFormatter={v => new Date(v).toLocaleDateString()} minTickGap={50} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickFormatter={v => format(v).split('.')[0]} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="totalValue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-textMuted text-sm">No historical data yet.</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'risk' && (
          <motion.div key="risk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="glass p-10 rounded-[40px] border border-white/5 h-[460px] flex flex-col bg-white/[0.01]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <TrendingDown className="text-danger" size={22} />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Underwater Analysis (Drawdown)</h3>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-textMuted uppercase tracking-widest">Max Drawdown</p>
                  <p className="text-xl font-black text-danger">-{safeNum(hm.maxDrawdown, 1)}%</p>
                </div>
              </div>
              <div className="flex-1">
                {drawdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={drawdownData}>
                      <defs>
                        <linearGradient id="colorDraw" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} fontWeight="bold" tickFormatter={v => new Date(v).toLocaleDateString()} minTickGap={50} />
                      <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickFormatter={v => `${v.toFixed(1)}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDraw)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-textMuted text-sm">No drawdown data yet.</div>
                )}
              </div>
            </div>

            {/* VaR Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Daily VaR (95%)', value: format(hm.var95), sub: 'Max expected daily loss with 95% confidence', color: 'text-amber-400' },
                { label: 'Daily VaR (99%)', value: format(hm.var99), sub: 'Max expected daily loss with 99% confidence', color: 'text-danger' },
                { label: 'Sortino Ratio', value: safeNum(hm.sortinoRatio), sub: 'Return per unit of downside risk', color: hm.sortinoRatio > 1 ? 'text-success' : 'text-white' },
              ].map((card, i) => (
                <div key={i} className="glass p-6 rounded-[32px] border border-white/5">
                  <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3">{card.label}</p>
                  <p className={`text-3xl font-black tracking-tighter ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-textMuted mt-2 font-medium leading-relaxed">{card.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;
